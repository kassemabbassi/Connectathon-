from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash

from config import settings
from database import users_collection


password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


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


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_access_token(user: dict) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_minutes
    )
    payload = {
        "sub": str(user["_id"]),
        "role": user["role"],
        "institution_id": str(user["institution_id"]),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "institution_id": str(user["institution_id"]),
        "status": user["status"],
    }


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
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