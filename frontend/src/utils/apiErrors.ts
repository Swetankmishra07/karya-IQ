/**
 * Utility functions for extracting clean, actionable error messages
 * from KaryaIQ API error responses and network errors.
 */

export function extractApiErrorMessage(err: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const anyErr = err as any;
  const data = anyErr.response?.data;

  // 1. Check KaryaIQ structured envelope: { error: { message, code } }
  if (data?.error?.message && typeof data.error.message === 'string') {
    return data.error.message;
  }

  // 2. Check standard FastAPI detail field
  if (data?.detail) {
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    // Handle Pydantic validation error lists: [{ loc, msg, type }]
    if (Array.isArray(data.detail)) {
      const formatted = data.detail
        .map((item: any) => {
          const loc = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : '';
          return loc ? `${loc}: ${item.msg}` : item.msg;
        })
        .filter(Boolean)
        .join('; ');
      if (formatted) return formatted;
    }
  }

  // 3. Check generic message
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  // 4. Check axios / standard error message
  if (anyErr.message && typeof anyErr.message === 'string') {
    if (anyErr.message === 'Network Error') {
      return 'Network error: Cannot reach the server. Check your connection or server status.';
    }
    return anyErr.message;
  }

  return fallback;
}

export function getApiErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const anyErr = err as any;
  return anyErr.response?.data?.error?.code || null;
}

export function isAiNotConfiguredError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as any;
  const status = anyErr.response?.status;
  const code = anyErr.response?.data?.error?.code;
  const msg = extractApiErrorMessage(err, '');
  return status === 503 || code === 'AI_NOT_CONFIGURED' || msg.includes('AI features are disabled') || msg.includes('AI provider configuration is incomplete');
}
