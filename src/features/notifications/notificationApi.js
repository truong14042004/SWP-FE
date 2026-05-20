import { authorizedRequest } from '../../api/http';

export function getMyNotifications(session, options = {}) {
  const params = new URLSearchParams();
  if (options.unreadOnly) params.set('unreadOnly', 'true');
  if (options.take) params.set('take', String(options.take));

  const query = params.toString();
  const path = query ? `/api/notifications?${query}` : '/api/notifications';
  return authorizedRequest(path, session);
}

export function markNotificationRead(session, id) {
  return authorizedRequest(`/api/notifications/${id}/read`, session, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead(session) {
  return authorizedRequest('/api/notifications/read-all', session, {
    method: 'PATCH',
  });
}
