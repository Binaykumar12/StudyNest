from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from core.config import settings
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from db.session import get_db
from schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from services.auth_service import authenticate_user, get_user_by_id, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    cookie_kwargs: dict = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
    }
    response.set_cookie(
        key=settings.access_token_cookie,
        value=access_token,
        max_age=settings.access_token_expire_minutes * 60,
        **cookie_kwargs,
    )
    response.set_cookie(
        key=settings.refresh_token_cookie,
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        **cookie_kwargs,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Delete auth cookies with matching attributes from set_cookie."""
    cookie_kwargs: dict = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": "lax",
        "path": "/",
    }
    response.delete_cookie(key=settings.access_token_cookie, **cookie_kwargs)
    response.delete_cookie(key=settings.refresh_token_cookie, **cookie_kwargs)


def _auth_response(response: Response, user, message: str) -> AuthResponse:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    _set_auth_cookies(response, access_token, refresh_token)
    return AuthResponse(user=UserResponse.model_validate(user), message=message)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    try:
        user = register_user(db, payload.email, payload.password)
    except ValueError as exc:
        if str(exc) == "Email already registered":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _auth_response(response, user, "Registration successful")


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _auth_response(response, user, "Login successful")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    _clear_auth_cookies(response)


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    token = request.cookies.get(settings.refresh_token_cookie)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        user_id = decode_refresh_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from exc

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return _auth_response(response, user, "Token refreshed")
