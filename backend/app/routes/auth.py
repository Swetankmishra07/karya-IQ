import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.services.auth_service import AuthService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Validates user credentials, hashes password, stores user in database, and returns created user profile."
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    POST /auth/register Endpoint
    """
    logger.info("Registration request received.")
    try:
        user = AuthService.register_user(user_data, db)
    except HTTPException as exc:
        logger.warning("Registration rejected with HTTP status %d.", exc.status_code)
        raise
    except SQLAlchemyError as exc:
        logger.error(
            "Registration failed due to a database error (%s): %s",
            type(exc).__name__,
            exc,
            exc_info=True,
        )
        raise

    logger.info("User registration succeeded.")
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials and returns a Bearer JWT Access Token."
)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    POST /auth/login Endpoint
    """
    return AuthService.authenticate_user(login_data, db)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token",
)
def refresh(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access/refresh pair."""
    return AuthService.refresh_tokens(token_data, db)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke refresh token",
)
def logout(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Revoke the presented refresh token without exposing token state."""
    AuthService.logout(token_data, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
