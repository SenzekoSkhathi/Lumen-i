# security.py
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

# We need these to find the user in the database
from database import get_db
from models import User

# Load environment variables from .env file
load_dotenv()

# --- Environment Variables with Validation ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Validate critical environment variables
if not SECRET_KEY:
    raise ValueError("FATAL ERROR: 'SECRET_KEY' is not set in the .env file.")
if len(SECRET_KEY) < 32:
    raise ValueError("FATAL ERROR: 'SECRET_KEY' must be at least 32 characters long.")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("⚠️  WARNING: Google OAuth credentials not set. Google login will not work.")

# --- Password Hashing ---

def hash_password(password: str) -> str:
    """Hashes a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if a plain-text password matches a hashed password.
    Safely handles non-bcrypt hashes (like Google OAuth placeholder strings).
    """
    if not hashed_password:
        return False

    # [FIX] Relaxed check to allow $2a$, $2b$, $2y$ prefixes
    if not hashed_password.startswith("$2"):
        return False

    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        # If the hash format is invalid, return False instead of crashing
        return False

# --- JWT Token Handling ---

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    institution_id: Optional[int] = None
    user_id: Optional[int] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """
    Checks if a token is valid and returns its payload (data).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return TokenData(
            email=email,
            role=payload.get("role"),
            institution_id=payload.get("institution_id"),
            user_id=payload.get("user_id"),
        )
    except JWTError:
        return None

# --- FastAPI Dependencies ---

# [FIX] Updated tokenUrl to match the prefix in auth.py (/api/auth)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_db)) -> User:
    """
    A reusable function (a "dependency") that our API endpoints
    can use to get the currently logged-in user.
    """
    
    token_data = verify_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = select(User).where(User.email == token_data.email)
    user = session.exec(statement).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    return user

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    A dependency that checks if the current user is an admin.
    If not, it raises a 403 Forbidden error.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. User is not an admin."
        )
    return current_user


def require_role(*allowed_roles: str):
    def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this role."
            )
        return current_user

    return _guard


def get_lecturer_user(current_user: User = Depends(require_role("lecturer"))) -> User:
    return current_user


def get_student_user(current_user: User = Depends(require_role("student"))) -> User:
    return current_user
