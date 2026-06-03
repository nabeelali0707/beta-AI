import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from app.dependencies import get_current_user
from app.schemas.auth import ForgotPasswordRequest, Token, UserLogin, UserRegister
from app.schemas.user import UserRead

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=Token)
async def register(request: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(User.__table__.select().where(User.email == request.email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = hash_password(request.password)
    new_user = User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create token
    access_token = create_access_token(str(new_user.id))

    logger.info(f"New user registered: {request.email}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=Token)
async def login(request: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    result = await db.execute(User.__table__.select().where(User.email == request.email))
    user = result.scalars().first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(str(user.id))

    logger.info(f"User logged in: {request.email}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat(),
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Request password reset (simplified)"""
    result = await db.execute(User.__table__.select().where(User.email == request.email))
    user = result.scalars().first()

    if not user:
        # Don't reveal if email exists
        return {"message": "If email exists, reset link sent"}

    logger.info(f"Password reset requested for: {request.email}")
    return {"message": "If email exists, reset link sent"}
