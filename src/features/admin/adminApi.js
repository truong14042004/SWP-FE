import { authorizedRequest } from '../../api/http';

export async function loadAdminDashboard(session) {
  const [
    overview,
    users,
    payments,
    paymentSubscriptions,
    invoices,
    plans,
    assignments,
  ] = await Promise.all([
    authorizedRequest('/api/admin/stats/overview', session),
    authorizedRequest('/api/admin/users', session),
    authorizedRequest('/api/admin/payments', session),
    authorizedRequest('/api/admin/payments/subscriptions', session),
    authorizedRequest('/api/admin/payments/invoices', session),
    authorizedRequest('/api/admin/subscription-plans', session),
    authorizedRequest('/api/admin/counselor-assignments', session).catch(() => []),
  ]);

  return {
    stats: overview,
    users,
    payments,
    paymentSubscriptions,
    invoices,
    plans,
    assignments,
  };
}


export function getAdminUser(session, id) {
  return authorizedRequest(`/api/admin/users/${id}`, session);
}

export function saveAdminUser(session, user, id) {
  return authorizedRequest(id ? `/api/admin/users/${id}` : '/api/admin/users', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(user),
  });
}

export function uploadAdminUserAvatar(session, id, file) {
  const formData = new FormData();
  formData.append('File', file);

  return authorizedRequest(`/api/admin/users/${id}/avatar`, session, {
    method: 'POST',
    body: formData,
  });
}

export function deleteAdminUser(session, id) {
  return authorizedRequest(`/api/admin/users/${id}`, session, { method: 'DELETE' });
}

export function updateUserStatus(session, id, isActive) {
  return authorizedRequest(`/api/admin/users/${id}/status`, session, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export function getPayment(session, id) {
  return authorizedRequest(`/api/admin/payments/${id}`, session);
}

export function getSubscriptionPlan(session, id) {
  return authorizedRequest(`/api/admin/subscription-plans/${id}`, session);
}

export function updatePaymentStatus(session, id, status) {
  return authorizedRequest(`/api/admin/payments/${id}/status`, session, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function saveSubscriptionPlan(session, plan, id) {
  return authorizedRequest(id ? `/api/admin/subscription-plans/${id}` : '/api/admin/subscription-plans', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(plan),
  });
}

export function deleteSubscriptionPlan(session, id) {
  return authorizedRequest(`/api/admin/subscription-plans/${id}`, session, { method: 'DELETE' });
}

/* Counselor assignments */
export function createCounselorAssignment(session, payload) {
  return authorizedRequest('/api/admin/counselor-assignments', session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteCounselorAssignment(session, id) {
  return authorizedRequest(`/api/admin/counselor-assignments/${id}`, session, {
    method: 'DELETE',
  });
}

export function enableCounselorAssignment(session, id) {
  return authorizedRequest(`/api/admin/counselor-assignments/${id}/enable`, session, {
    method: 'PUT',
  });
}

export function fetchDailyStats(session, year, month) {
  const params = new URLSearchParams();
  if (year)  params.set('year',  String(year));
  if (month) params.set('month', String(month));
  const query = params.toString();
  const path = query ? `/api/admin/stats/daily?${query}` : '/api/admin/stats/daily';
  return authorizedRequest(path, session);
}
