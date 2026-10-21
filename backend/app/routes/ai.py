from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.database.models import ActivityLog, Comment, User
from app.dependencies.authorization import require_member
from app.schemas.ai import (
    AIPrioritySuggestionResponse,
    AISummaryResponse,
    AITaskCreateRequest,
    AITaskCreateResponse,
)
from app.schemas.task import TaskCreate
from app.services.ai_service import (
    AIAuthenticationError,
    AIConfigurationError,
    AIModelNotFoundError,
    AIProviderError,
    AIQuotaError,
    AIResponseFormatError,
    AIService,
    AITimeoutError,
    _is_placeholder,
)
from app.services.task_service import TaskService


router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()


def _ai_error(exc: Exception) -> HTTPException:
    if isinstance(exc, AIConfigurationError):
        return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    if isinstance(exc, AIAuthenticationError):
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    if isinstance(exc, AIQuotaError):
        return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))
    if isinstance(exc, AITimeoutError):
        return HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc))
    if isinstance(exc, (AIResponseFormatError, AIModelNotFoundError, AIProviderError)):
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    if isinstance(exc, HTTPException):
        return exc
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider is unavailable or returned invalid data.")


def _parse_deadline(val: Any) -> datetime | None:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        cleaned = val.strip()
        if not cleaned or cleaned.lower() in {"null", "none", "not specified"}:
            return None
        # Try ISO 8601
        try:
            return datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        except ValueError:
            pass
        # Try YYYY-MM-DD
        try:
            return datetime.strptime(cleaned, "%Y-%m-%d")
        except ValueError:
            pass
    return None


def _task_context(task, db: Session) -> dict[str, Any]:
    comments = db.query(Comment).filter(Comment.task_id == task.id).order_by(Comment.id).all()
    activity = db.query(ActivityLog).filter(ActivityLog.task_id == task.id).order_by(ActivityLog.id).all()
    return {
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "deadline": task.deadline.isoformat() if isinstance(task.deadline, datetime) else task.deadline,
        },
        "comments": [{"body": comment.body, "created_at": comment.created_at.isoformat()} for comment in comments],
        "activity": [
            {"action": event.action, "entity_type": event.entity_type, "metadata": event.metadata_json}
            for event in activity
        ],
    }


@router.get("/status", status_code=status.HTTP_200_OK)
def get_ai_status(current_user: User = Depends(require_member)):
    """Safe diagnostic endpoint reporting AI configuration status without exposing secrets."""
    missing = []
    if not settings.AI_API_KEY or _is_placeholder(settings.AI_API_KEY):
        missing.append("AI_API_KEY")
    if not settings.AI_API_URL or not settings.AI_API_URL.strip():
        missing.append("AI_API_URL")
    if not settings.AI_MODEL or _is_placeholder(settings.AI_MODEL):
        missing.append("AI_MODEL")
    return {
        "enabled": bool(settings.AI_ENABLED),
        "provider": settings.AI_PROVIDER,
        "configured": bool(settings.AI_ENABLED and not missing and settings.AI_PROVIDER == "openai_compatible"),
        "model": settings.AI_MODEL if settings.AI_ENABLED else None,
        "missing_settings": missing if settings.AI_ENABLED else [],
    }


@router.post("/tasks/from-text", response_model=AITaskCreateResponse, status_code=status.HTTP_201_CREATED)
def create_task_from_text(
    request: AITaskCreateRequest,
    current_user: User = Depends(require_member),
    db: Session = Depends(get_db),
):
    try:
        draft = ai_service.create_task(request.prompt)
        deadline_dt = _parse_deadline(draft.deadline)

        task_data = TaskCreate(
            title=draft.title,
            description=draft.description,
            status=draft.status,
            priority=draft.priority,
            deadline=deadline_dt,
            assignee_id=request.assignee_id,
            project_id=request.project_id,
        )
        return TaskService.create_task(task_data, current_user, db)
    except (AIConfigurationError, AIProviderError) as exc:
        raise _ai_error(exc) from exc
    except (ValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid task draft generated by AI: {exc}",
        ) from exc


@router.post("/tasks/{task_id}/summary", response_model=AISummaryResponse)
def summarize_task(
    task_id: int,
    current_user: User = Depends(require_member),
    db: Session = Depends(get_db),
):
    task = TaskService.get_task_by_id(task_id, current_user, db)
    try:
        return {"summary": ai_service.summarize_task(_task_context(task, db))}
    except (AIConfigurationError, AIProviderError) as exc:
        raise _ai_error(exc) from exc


@router.post("/tasks/{task_id}/priority-suggestion", response_model=AIPrioritySuggestionResponse)
def suggest_task_priority(
    task_id: int,
    current_user: User = Depends(require_member),
    db: Session = Depends(get_db),
):
    task = TaskService.get_task_by_id(task_id, current_user, db)
    try:
        priority, explanation = ai_service.suggest_priority(_task_context(task, db))
        return {"priority": priority, "explanation": explanation}
    except (AIConfigurationError, AIProviderError) as exc:
        raise _ai_error(exc) from exc