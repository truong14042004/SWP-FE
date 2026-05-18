import { apiUrl } from '../config';
import { getSessionToken } from '../auth/session';

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
  }

  return payload;
}

export async function apiRequest(endpoint, options = {}) {
  if (!apiUrl) {
    throw new Error('Thiếu cấu hình VITE_API_URL.');
  }

  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  return readResponse(response);
}

export async function authorizedRequest(endpoint, session, options = {}) {
  const token = getSessionToken(session);
  return apiRequest(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
