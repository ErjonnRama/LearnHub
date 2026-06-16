import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.models import User, Role, UserRole, RefreshToken
from app.schemas.schemas import UserCreate, LoginRequest, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings


class AuthService:

    @staticmethod
    async def register(data: UserCreate, db: AsyncSession) -> User:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            password_hash=get_password_hash(data.password),
        )
        db.add(user)
        await db.flush()

        # Assign default "User" role
        role_result = await db.execute(select(Role).where(Role.name == "User"))
        role = role_result.scalar_one_or_none()
        if role:
            db.add(UserRole(user_id=user.id, role_id=role.id))

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def login(data: LoginRequest, db: AsyncSession) -> TokenResponse:
        result = await db.execute(select(User).where(User.email == data.email, User.is_active == True))
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
        await db.commit()

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    @staticmethod
    async def refresh(refresh_token: str, db: AsyncSession) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at == None,
            )
        )
        stored = result.scalar_one_or_none()
        if not stored or stored.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(status_code=401, detail="Refresh token expired or revoked")

        # Rotate token
        stored.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        user_id = payload.get("sub")
        new_access = create_access_token({"sub": user_id})
        new_refresh = create_refresh_token({"sub": user_id})
        new_hash = hashlib.sha256(new_refresh.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db.add(RefreshToken(user_id=int(user_id), token_hash=new_hash, expires_at=expires_at))
        await db.commit()
        return TokenResponse(access_token=new_access, refresh_token=new_refresh)
