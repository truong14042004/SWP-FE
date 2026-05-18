import { apiRequest, authorizedRequest } from '../../api/http';

export async function loadAdminDashboard(session) {
  const [
    overview,
    userStats,
    paymentStats,
    subscriptionStats,
    learningResourcesStats,
    careerRoleStats,
    users,
    payments,
    paymentSubscriptions,
    invoices,
    plans,
    skills,
    learningResources,
    roleSkillRequirements,
    careerRoles,
  ] = await Promise.all([
    authorizedRequest('/api/admin/stats/overview', session),
    authorizedRequest('/api/admin/stats/users', session),
    authorizedRequest('/api/admin/stats/payments', session),
    authorizedRequest('/api/admin/stats/subscriptions', session),
    authorizedRequest('/api/admin/stats/learning-resources', session),
    authorizedRequest('/api/admin/stats/career-roles', session),
    authorizedRequest('/api/admin/users', session),
    authorizedRequest('/api/admin/payments', session),
    authorizedRequest('/api/admin/payments/subscriptions', session),
    authorizedRequest('/api/admin/payments/invoices', session),
    authorizedRequest('/api/admin/subscription-plans', session),
    authorizedRequest('/api/admin/skills', session),
    authorizedRequest('/api/admin/learning-resources', session),
    authorizedRequest('/api/admin/role-skill-requirements', session),
    authorizedRequest('/api/career-roles', session),
  ]);

  return {
    stats: {
      ...overview,
      users: userStats,
      payments: paymentStats,
      subscriptions: subscriptionStats,
      learningResources: learningResourcesStats,
      careerRoles: careerRoleStats,
    },
    users,
    payments,
    paymentSubscriptions,
    invoices,
    plans,
    skills,
    learningResources,
    roleSkillRequirements,
    careerRoles,
  };
}

export function getAdminUser(session, id) {
  return authorizedRequest(`/api/admin/users/${id}`, session);
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

export function saveSkill(session, skill, id) {
  return authorizedRequest(id ? `/api/admin/skills/${id}` : '/api/admin/skills', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(skill),
  });
}

export function getSkill(session, id) {
  return authorizedRequest(`/api/admin/skills/${id}`, session);
}

export function deleteSkill(session, id) {
  return authorizedRequest(`/api/admin/skills/${id}`, session, { method: 'DELETE' });
}

export function getLearningResource(session, id) {
  return authorizedRequest(`/api/admin/learning-resources/${id}`, session);
}

export function saveLearningResource(session, resource, id) {
  return authorizedRequest(id ? `/api/admin/learning-resources/${id}` : '/api/admin/learning-resources', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(resource),
  });
}

export function uploadLearningResource(session, resource) {
  const formData = new FormData();
  const formKeys = {
    skillId: 'SkillId',
    title: 'Title',
    resourceType: 'ResourceType',
    difficulty: 'Difficulty',
    estimatedHours: 'EstimatedHours',
    isActive: 'IsActive',
    file: 'File',
  };
  Object.entries(resource).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(formKeys[key] || key, value);
    }
  });

  return authorizedRequest('/api/admin/learning-resources/upload', session, {
    method: 'POST',
    body: formData,
  });
}

export function deleteLearningResource(session, id) {
  return authorizedRequest(`/api/admin/learning-resources/${id}`, session, { method: 'DELETE' });
}

export function getRoleSkillRequirement(session, id) {
  return authorizedRequest(`/api/admin/role-skill-requirements/${id}`, session);
}

export function saveRoleSkillRequirement(session, requirement, id) {
  return authorizedRequest(
    id ? `/api/admin/role-skill-requirements/${id}` : '/api/admin/role-skill-requirements',
    session,
    {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(requirement),
    },
  );
}

export function deleteRoleSkillRequirement(session, id) {
  return authorizedRequest(`/api/admin/role-skill-requirements/${id}`, session, { method: 'DELETE' });
}

export function getCareerRole(session, id) {
  return authorizedRequest(`/api/career-roles/${id}`, session);
}

export function saveCareerRole(session, careerRole, id) {
  return authorizedRequest(id ? `/api/career-roles/${id}` : '/api/career-roles', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(careerRole),
  });
}

export function deleteCareerRole(session, careerRole) {
  return saveCareerRole(session, { ...careerRole, isActive: false }, careerRole.id);
}

export function getCareerRoles() {
  return apiRequest('/api/career-roles');
}
