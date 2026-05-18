export const storageKey = 'careermap.auth';

export function getStoredSession() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function persistSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(storageKey);
}

export function getSessionToken(session) {
  return session?.token || session?.accessToken || '';
}

export function getSessionRole(session) {
  return session?.user?.role || session?.role || '';
}
