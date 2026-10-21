import json
import logging
import socket
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Optional

from app.core.config import settings
from app.schemas.ai import AITaskDraft
from app.schemas.task import TaskPriority, TaskStatus


logger = logging.getLogger(__name__)


class AIConfigurationError(RuntimeError):
    """Raised when AI is disabled or missing required provider settings."""


class AIProviderError(RuntimeError):
    """Base exception for provider failures."""


class AIAuthenticationError(AIProviderError):
    """Raised when AI provider authentication fails (e.g. invalid API key)."""


class AIQuotaError(AIProviderError):
    """Raised when AI provider rate limit or quota is exceeded."""


class AIModelNotFoundError(AIProviderError):
    """Raised when AI model or endpoint is not found."""


class AITimeoutError(AIProviderError):
    """Raised when AI provider request times out."""


class AIResponseFormatError(AIProviderError):
    """Raised when AI provider returns empty or unparseable output."""


class AIProvider(ABC):
    @abstractmethod
    def create_task(self, prompt: str) -> AITaskDraft:
        raise NotImplementedError

    @abstractmethod
    def summarize_task(self, context: dict[str, Any]) -> str:
        raise NotImplementedError

    @abstractmethod
    def suggest_priority(self, context: dict[str, Any]) -> tuple[TaskPriority, str]:
        raise NotImplementedError


def _is_placeholder(value: Optional[str]) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    return normalized in {
        "replace-with-provider-key",
        "replace-with-a-real-key",
        "replace-with-model-name",
        "your_real_ai_api_key",
        "your_gemini_api_key",
        "your_api_key_here",
    }


class OpenAICompatibleProvider(AIProvider):
    """Adapter for providers exposing a Chat Completions-compatible API (e.g. Gemini, OpenAI)."""

    def __init__(self, api_key: str, api_url: str, model: str, timeout: float) -> None:
        self.api_key = api_key
        self.api_url = api_url
        self.model = model
        self.timeout = timeout

    def _complete_json(self, instruction: str, context: Any) -> dict[str, Any]:
        body = json.dumps({
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": instruction},
                {"role": "user", "content": json.dumps(context, default=str)},
            ],
        }).encode("utf-8")
        request = urllib.request.Request(
            self.api_url,
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw_payload = response.read().decode("utf-8")
                payload = json.loads(raw_payload)
        except urllib.error.HTTPError as exc:
            logger.error("AI provider HTTP error: %s %s", exc.code, exc.reason)
            if exc.code in {401, 403}:
                raise AIAuthenticationError("AI provider authentication failed. Check that AI_API_KEY is valid.") from exc
            if exc.code == 429:
                raise AIQuotaError("AI provider rate limit or quota exceeded. Please try again later.") from exc
            if exc.code == 404:
                raise AIModelNotFoundError(f"AI model '{self.model}' or endpoint not found (HTTP 404).") from exc
            if 500 <= exc.code <= 599:
                raise AIProviderError(f"AI provider service error (HTTP {exc.code}). Please try again later.") from exc
            raise AIProviderError(f"AI provider request failed with HTTP status {exc.code}.") from exc
        except (TimeoutError, urllib.error.URLError) as exc:
            if isinstance(getattr(exc, "reason", None), (TimeoutError, socket.timeout)) or isinstance(exc, TimeoutError):
                logger.error("AI provider request timed out.")
                raise AITimeoutError("AI provider request timed out. Please try again.") from exc
            logger.error("AI provider network error: %s", exc)
            raise AIProviderError("AI provider network connection failed. Check AI_API_URL.") from exc
        except Exception as exc:
            logger.error("Unexpected error connecting to AI provider: %s", exc)
            raise AIProviderError("AI provider request failed.") from exc

        try:
            choices = payload.get("choices")
            if not choices or not isinstance(choices, list):
                raise ValueError("Payload missing 'choices' array")
            message = choices[0].get("message") or {}
            content = message.get("content")
            if content is None:
                raise ValueError("Message content is null")
            if isinstance(content, str):
                content = content.strip()
                if content.startswith("```"):
                    lines = content.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    content = "\n".join(lines).strip()
                result = json.loads(content)
            elif isinstance(content, dict):
                result = content
            else:
                raise ValueError("Unexpected content type")
            if not isinstance(result, dict):
                raise ValueError("Parsed result is not a JSON object")
            return result
        except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
            logger.error("Failed to parse AI provider response: %s", exc)
            raise AIResponseFormatError("AI provider returned an invalid or unparseable response.") from exc

    def create_task(self, prompt: str) -> AITaskDraft:
        instruction = (
            "Convert the user's natural language request into a task JSON object with title, description, status, priority, and deadline. "
            "Use only valid task status (todo, in_progress, pending, blocked, completed) and priority (low, medium, high, critical). "
            "Set deadline to an ISO 8601 string (e.g. '2026-10-23T00:00:00Z' or '2026-10-23') or null if not specified. "
            "Keep title concise and under 100 characters. Do not invent assignee_id or project_id."
        )
        result = self._complete_json(instruction, {"prompt": prompt})

        # Sanitize status
        if "status" in result and result["status"]:
            try:
                result["status"] = TaskStatus(str(result["status"]).lower()).value
            except ValueError:
                result["status"] = TaskStatus.TODO.value

        # Sanitize priority
        if "priority" in result and result["priority"]:
            try:
                result["priority"] = TaskPriority(str(result["priority"]).lower()).value
            except ValueError:
                result["priority"] = TaskPriority.LOW.value

        # Sanitize title
        if "title" in result and isinstance(result["title"], str):
            result["title"] = result["title"].strip()[:100]
        else:
            result["title"] = "Untitled Task"

        # Sanitize deadline
        if "deadline" in result and not result["deadline"]:
            result["deadline"] = None

        # Ensure no hallucinated assignees or projects in draft
        result["assignee_id"] = None
        result["project_id"] = None

        try:
            return AITaskDraft.model_validate(result)
        except Exception as exc:
            raise AIResponseFormatError(f"AI provider returned an invalid task draft: {exc}") from exc

    def summarize_task(self, context: dict[str, Any]) -> str:
        result = self._complete_json(
            "Summarize the authorized task context in 1-3 concise sentences. Return JSON with a 'summary' string only.",
            context,
        )
        summary = result.get("summary")
        if not isinstance(summary, str) or not summary.strip():
            raise AIResponseFormatError("AI provider returned an invalid summary")
        return summary.strip()

    def suggest_priority(self, context: dict[str, Any]) -> tuple[TaskPriority, str]:
        result = self._complete_json(
            "Suggest a task priority based on the authorized task context. Return JSON with priority (low, medium, high, or critical) and a short explanation.",
            context,
        )
        try:
            raw_priority = str(result.get("priority", "medium")).lower()
            priority = TaskPriority(raw_priority)
        except ValueError:
            priority = TaskPriority.MEDIUM

        explanation = result.get("explanation")
        if not isinstance(explanation, str) or not explanation.strip():
            explanation = "Priority suggested based on task requirements."
        return priority, explanation.strip()


def configured_provider() -> AIProvider:
    if not settings.AI_ENABLED:
        raise AIConfigurationError("AI features are disabled on the server (AI_ENABLED=false).")
    if settings.AI_PROVIDER != "openai_compatible":
        raise AIConfigurationError(f"Configured AI provider '{settings.AI_PROVIDER}' is not supported. Supported: openai_compatible.")
    missing = []
    if not settings.AI_API_KEY or _is_placeholder(settings.AI_API_KEY):
        missing.append("AI_API_KEY")
    if not settings.AI_API_URL or not settings.AI_API_URL.strip():
        missing.append("AI_API_URL")
    if not settings.AI_MODEL or _is_placeholder(settings.AI_MODEL):
        missing.append("AI_MODEL")
    if missing:
        raise AIConfigurationError(f"AI provider configuration is incomplete. Set: {', '.join(missing)}.")
    return OpenAICompatibleProvider(
        api_key=settings.AI_API_KEY.strip(),
        api_url=settings.AI_API_URL.strip(),
        model=settings.AI_MODEL.strip(),
        timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
    )


class AIService:
    def __init__(self, provider: Optional[AIProvider] = None) -> None:
        self.provider = provider

    def _provider(self) -> AIProvider:
        return self.provider or configured_provider()

    def create_task(self, prompt: str) -> AITaskDraft:
        return self._provider().create_task(prompt)

    def summarize_task(self, context: dict[str, Any]) -> str:
        return self._provider().summarize_task(context)

    def suggest_priority(self, context: dict[str, Any]) -> tuple[TaskPriority, str]:
        return self._provider().suggest_priority(context)