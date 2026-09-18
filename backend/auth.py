from datetime import datetime, timedelta, timezone
import secrets
from typing import Annotated

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from config import settings
from database import users_collection


password_hash = PasswordHash.recommended()


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str
    institution_id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AccountStatusRequest(BaseModel):
    status: str


class InstitutionCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_access_token(user: dict) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_minutes
    )
    institution_id = user.get("institution_id")
    payload = {
        "sub": str(user["_id"]),
        "role": user["role"],
        "institution_id": str(institution_id) if institution_id else "",
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def public_user(user: dict) -> dict:
    institution_id = user.get("institution_id")
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "institution_id": str(institution_id) if institution_id else "",
        "status": user["status"],
    }


def get_current_user(request: Request) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
    )
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise unauthorized

    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        csrf_cookie = request.cookies.get(settings.csrf_cookie_name)
        csrf_header = request.headers.get("X-CSRF-Token")
        if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token.")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = ObjectId(payload["sub"])
    except (jwt.InvalidTokenError, InvalidId, KeyError, TypeError):
        raise unauthorized from None

    user = users_collection.find_one({"_id": user_id})
    if not user or user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active.",
        )
    return user


def require_roles(*allowed_roles: str):
    def dependency(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency
