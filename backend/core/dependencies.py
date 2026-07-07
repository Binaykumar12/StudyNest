"""
Role-based access control dependencies for FastAPI routes.

Provides:
- get_current_user: Extracts and validates JWT from cookie
- get_current_admin: Validates current user is admin role
- get_current_student: Validates current user is student role
"""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from core.config import settings
from core.security import decode_access_token
from db.session import get_db
from models.enums import UserRole
from models.user import User


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Extract current user from access_token cookie.
    Raises 401 if token missing, invalid, or expired.
    """
    token = request.cookies.get(settings.access_token_cookie)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Validate that current user has admin role.
    Raises 403 if user is not admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


async def get_current_student(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Validate that current user has student role.
    Raises 403 if user is not student.
    """
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student role required",
        )
    return current_user
