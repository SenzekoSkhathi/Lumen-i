# auth.py
from fastapi import (
    APIRouter, Depends, HTTPException, status, Request,
    File, UploadFile
)
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
import os
import datetime
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User, UserCreate, UserPublic, Token, UserUpdate
from security import hash_password, create_access_token, verify_password, get_current_user
from supabase_client import supabase

router = APIRouter(
    prefix="/api/auth", 
    tags=["Authentication"]
)

# --- Environment Variables ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("⚠️  WARNING: Google OAuth credentials not configured")

oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
else:
    print("❌ Google OAuth disabled - missing credentials")

# --- CHANGE PASSWORD MODEL ---
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# --- NEW: Forgot Password payload ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# ====================================
# SIGNUP
# ====================================
@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup_user(user_data: UserCreate, session: Session = Depends(get_db)):
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pass = hash_password(user_data.password)

    now_utc = datetime.datetime.now(datetime.timezone.utc)

    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role="student",
        hashed_password=hashed_pass,
        last_login=now_utc
    )

    try:
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Error creating user.")

    return new_user

# ====================================
# LOGIN
# ====================================
@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_db)
):
    # [DEBUG LOGS]
    print(f"👉 Login attempt for: '{form_data.username}'") 
    
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()

    if not user:
        print(f"❌ Login Failed: User '{form_data.username}' not found in DB.")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    is_valid = verify_password(form_data.password, user.hashed_password)
    
    if not is_valid:
        print(f"❌ Login Failed: Password mismatch for '{form_data.username}'.")
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    print(f"✅ Login Success: {user.email} ({user.role})")

    # Update last login
    user.last_login = datetime.datetime.now(datetime.timezone.utc)
    session.add(user)
    session.commit()

    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer")

# ====================================
# FORGOT PASSWORD
# ====================================
@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    session: Session = Depends(get_db),
):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    
    if not user:
        return {
            "message": "If an account exists for this email, a reset link has been sent."
        }
    
    expires_delta = datetime.timedelta(hours=1)
    reset_token = create_access_token(
        {"sub": str(user.email), "scope": "password_reset"}, expires_delta=expires_delta
    )
    
    print(
        f"[Lumeni] Password reset token for {user.email}: {reset_token} (expires in {expires_delta})"
    )
    return {
        "message": "If an account exists for this email, a reset link has been sent."
    }

# ====================================
# AUTH ME
# ====================================
@router.get("/me", response_model=UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# ====================================
# GOOGLE OAUTH LOGIN
# ====================================
@router.get("/login/google")
async def login_google(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    redirect_uri = f"{API_BASE_URL}/api/auth/google"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google")
async def auth_google(request: Request, session: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        print(f"Google Auth Error: {e}")
        raise HTTPException(status_code=400, detail="Google login failed")

    user_info = token.get('userinfo')
    if not user_info:
        user_info = await oauth.google.userinfo(token=token)

    email = user_info.get('email')
    name = user_info.get('name')

    db_user = session.exec(select(User).where(User.email == email)).first()

    now_utc = datetime.datetime.now(datetime.timezone.utc)

    if not db_user:
        db_user = User(
            email=email,
            full_name=name,
            role="student",
            hashed_password="GOOGLE_OAUTH_USER_NO_PASSWORD",
            last_login=now_utc
        )
    else:
        db_user.last_login = now_utc

    try:
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    except Exception as e:
        session.rollback()
        print(f"Error saving Google user: {e}")
        raise HTTPException(status_code=500, detail="Error processing login.")

    access_token = create_access_token(data={"sub": db_user.email})

    frontend_redirect_url = f"{FRONTEND_URL}/google-callback?token={access_token}"
    return RedirectResponse(url=frontend_redirect_url)

# ====================================
# UPDATE PROFILE
# ====================================
@router.put("/me", response_model=UserPublic)
def update_user_me(
    user_data: UserUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.full_name = user_data.full_name

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

# ====================================
# UPLOAD AVATAR
# ====================================
@router.post("/me/avatar", response_model=UserPublic)
async def upload_user_avatar(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type.")

    contents = await file.read()

    ext = file.content_type.split("/")[1]
    file_path = f"user_{current_user.id}_avatar_{datetime.datetime.now().timestamp()}.{ext}"

    supabase.storage.from_("profile_pics").upload(
        file_path,
        contents,
        {"content-type": file.content_type}
    )

    public_url = supabase.storage.from_("profile_pics").get_public_url(file_path)

    current_user.avatar_url = public_url
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user

# ====================================
# CHANGE PASSWORD
# ====================================
@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_user_password(
    passwords: PasswordChange,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")

    if len(passwords.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    current_user.hashed_password = hash_password(passwords.new_password)
    session.add(current_user)
    session.commit()

    return