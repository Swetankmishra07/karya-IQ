from fastapi import Request, FastAPI, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError


def _error_code(status_code: int, detail: object) -> str:
    """Map HTTP failures to stable client-facing error codes."""
    if isinstance(detail, str):
        if detail.startswith("Task with ID"):
            return "TASK_NOT_FOUND"
        detail_lower = detail.lower()
        if "ai" in detail_lower or "provider" in detail_lower:
            if status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                return "AI_NOT_CONFIGURED"
            if status_code == status.HTTP_502_BAD_GATEWAY:
                return "AI_PROVIDER_ERROR"
            if status_code == status.HTTP_504_GATEWAY_TIMEOUT:
                return "AI_TIMEOUT"
            if status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                return "RATE_LIMIT_EXCEEDED"
    if status_code == status.HTTP_404_NOT_FOUND:
        return "RESOURCE_NOT_FOUND"
    if status_code == status.HTTP_401_UNAUTHORIZED:
        return "UNAUTHORIZED"
    if status_code == status.HTTP_403_FORBIDDEN:
        return "FORBIDDEN"
    if status_code == status.HTTP_422_UNPROCESSABLE_CONTENT:
        return "VALIDATION_ERROR"
    if status_code == status.HTTP_400_BAD_REQUEST:
        return "BAD_REQUEST"
    if status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        return "RATE_LIMIT_EXCEEDED"
    if status_code == status.HTTP_504_GATEWAY_TIMEOUT:
        return "GATEWAY_TIMEOUT"
    if status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
        return "DATABASE_UNAVAILABLE"
    if status_code == status.HTTP_502_BAD_GATEWAY:
        return "BAD_GATEWAY"
    return "HTTP_ERROR"


def register_exception_handlers(app: FastAPI):
    """
    Registers custom global exception handlers for standardized JSON responses.
    Prevents unhandled 500 internal server error stack trace leaks.
    """

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": exc.detail,
                "error": {
                    "code": _error_code(exc.status_code, exc.detail),
                    "message": exc.detail,
                },
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation error",
                    "details": jsonable_encoder(exc.errors()),
                },
            }
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "A database error occurred.",
                },
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred.",
                },
            },
        )
