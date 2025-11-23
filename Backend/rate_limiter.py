# rate_limiter.py
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time
from typing import Dict, Tuple

# Simple in-memory rate limiting (use Redis in production)
request_log: Dict[str, list] = {}

class RateLimiter:
    def __init__(self, requests: int = 100, window: int = 900):  # 100 requests per 15 minutes
        self.requests = requests
        self.window = window
    
    async def __call__(self, request: Request):
        client_ip = request.client.host
        now = time.time()
        
        if client_ip not in request_log:
            request_log[client_ip] = []
        
        # Clean old requests
        request_log[client_ip] = [req_time for req_time in request_log[client_ip] if now - req_time < self.window]
        
        if len(request_log[client_ip]) >= self.requests:
            raise HTTPException(status_code=429, detail="Too many requests")
        
        request_log[client_ip].append(now)

# Apply rate limiting to auth endpoints
auth_rate_limiter = RateLimiter(requests=10, window=900)  # 10 login attempts per 15 minutes