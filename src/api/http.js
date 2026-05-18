import { apiUrl } from '../config';
import { clearSession, getRefreshToken, getSessionToken, getStoredSession, persistSession } from '../auth/session';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshSessionPromise = null;

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.', response.status);
  }

  return payload;
}

export async function apiRequest(endpoint, options = {}) {
  if (!apiUrl) {
    throw new Error('Thiếu cấu hình VITE_API_URL.');
  }

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  return readResponse(response);
}

export async function authorizedRequest(endpoint, session, options = {}) {
  const activeSession = getStoredSession() || session;

  try {
    return await apiRequest(endpoint, withBearer(options, getSessionToken(activeSession)));
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }

    const refreshedSession = await refreshSession(activeSession);
    return apiRequest(endpoint, withBearer(options, getSessionToken(refreshedSession)));
  }
}

function withBearer(options, token) {
  return {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };
}

async function refreshSession(session) {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshSessionOnce(session).finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

async function refreshSessionOnce(session) {
  const currentSession = getStoredSession() || session;
  const refreshToken = getRefreshToken(currentSession);

  if (!refreshToken) {
    clearSession();
    throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  try {
    const nextSession = await apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    persistSession(nextSession);
    return nextSession;
  } catch {
    clearSession();
    throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
  }
}
