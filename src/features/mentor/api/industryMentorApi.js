import { apiRequest, authorizedRequest } from '../../../api/http';

export function getReviewQueue(session) {
  return authorizedRequest('/api/industry-mentor/review-queue', session);
}

export function getStudentPortfolio(session, studentId) {
  return authorizedRequest(`/api/industry-mentor/students/${studentId}/portfolio`, session);
}

export function getStudentGithub(session, studentId) {
  return authorizedRequest(`/api/industry-mentor/students/${studentId}/github`, session);
}

export function getStudentQuota(session, studentId) {
  return authorizedRequest(`/api/industry-mentor/students/${studentId}/quota`, session);
}

export function getMyMentorFeedbacks(session) {
  return authorizedRequest('/api/industry-mentor/feedback', session);
}

export function getStudentMentorFeedbacks(session, studentId) {
  return authorizedRequest(`/api/industry-mentor/students/${studentId}/feedback`, session);
}

export function createMentorFeedback(session, payload) {
  return authorizedRequest('/api/industry-mentor/feedback', session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getStudentSkills(session, studentId) {
  return authorizedRequest(`/api/industry-mentor/students/${studentId}/skills`, session);
}

export function verifyStudentSkill(session, userSkillId) {
  return authorizedRequest(`/api/industry-mentor/user-skills/${userSkillId}/verify`, session, {
    method: 'POST',
  });
}

export function unverifyStudentSkill(session, userSkillId) {
  return authorizedRequest(`/api/industry-mentor/user-skills/${userSkillId}/unverify`, session, {
    method: 'POST',
  });
}

export function getSignedUrl(session, objectName) {
  return authorizedRequest(`/api/storage/signed-url?objectName=${encodeURIComponent(objectName)}`, session);
}

export function getMentorProfile(session, mentorId) {
  return authorizedRequest(`/api/mentors/${mentorId}`, session);
}

export function updateMyMentorProfile(session, payload) {
  return authorizedRequest('/api/mentors/my-profile', session, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function uploadMentorAvatar(session, file) {
  const formData = new FormData();
  formData.append('File', file);
  return authorizedRequest('/api/storage/avatar', session, {
    method: 'POST',
    body: formData,
  });
}

// ==========================================
// Catalog management (Skills, Resources, Requirements, Prerequisites)
// ==========================================

export function getCatalog(session) {
  return Promise.all([
    authorizedRequest('/api/industry-mentor/skills', session).catch(() => []),
    authorizedRequest('/api/industry-mentor/learning-resources', session).catch(() => []),
    authorizedRequest('/api/industry-mentor/role-skill-requirements', session).catch(() => []),
    authorizedRequest('/api/career-roles', session).catch(() => []),
    authorizedRequest('/api/industry-mentor/skill-prerequisites', session).catch(() => []),
  ]).then(([skills, learningResources, roleSkillRequirements, careerRoles, skillPrerequisites]) => ({
    skills,
    learningResources,
    roleSkillRequirements,
    careerRoles,
    skillPrerequisites,
  }));
}

/* Skills */
export function saveSkill(session, skill, id) {
  return authorizedRequest(id ? `/api/industry-mentor/skills/${id}` : '/api/industry-mentor/skills', session, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(skill),
  });
}

export function getSkill(session, id) {
  return authorizedRequest(`/api/industry-mentor/skills/${id}`, session);
}

export function deleteSkill(session, id) {
  return authorizedRequest(`/api/industry-mentor/skills/${id}`, session, { method: 'DELETE' });
}

/* Learning resources */
export function getLearningResource(session, id) {
  return authorizedRequest(`/api/industry-mentor/learning-resources/${id}`, session);
}

export function saveLearningResource(session, resource, id) {
  const formData = new FormData();
  const formKeys = {
    skillId: 'SkillId',
    title: 'Title',
    url: 'Url',
    resourceType: 'ResourceType',
    difficulty: 'Difficulty',
    estimatedHours: 'EstimatedHours',
    lessonNumber: 'LessonNumber',
    isActive: 'IsActive',
    file: 'File',
  };
  Object.entries(resource).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(formKeys[key] || key, value);
    }
  });

  return authorizedRequest(id ? `/api/industry-mentor/learning-resources/${id}` : '/api/industry-mentor/learning-resources', session, {
    method: id ? 'PUT' : 'POST',
    body: formData,
  });
}

export function deleteLearningResource(session, id) {
  return authorizedRequest(`/api/industry-mentor/learning-resources/${id}`, session, { method: 'DELETE' });
}

/* Role skill requirements */
export function getRoleSkillRequirement(session, id) {
  return authorizedRequest(`/api/industry-mentor/role-skill-requirements/${id}`, session);
}

export function saveRoleSkillRequirement(session, requirement, id) {
  return authorizedRequest(
    id ? `/api/industry-mentor/role-skill-requirements/${id}` : '/api/industry-mentor/role-skill-requirements',
    session,
    {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(requirement),
    },
  );
}

export function deleteRoleSkillRequirement(session, id) {
  return authorizedRequest(`/api/industry-mentor/role-skill-requirements/${id}`, session, { method: 'DELETE' });
}

/* Skill prerequisites */
export function getSkillPrerequisite(session, id) {
  return authorizedRequest(`/api/industry-mentor/skill-prerequisites/${id}`, session);
}

export function saveSkillPrerequisite(session, prerequisite) {
  return authorizedRequest('/api/industry-mentor/skill-prerequisites', session, {
    method: 'POST',
    body: JSON.stringify(prerequisite),
  });
}

export function deleteSkillPrerequisite(session, skillId, prerequisiteSkillId) {
  return authorizedRequest(`/api/industry-mentor/skill-prerequisites/${skillId}/${prerequisiteSkillId}`, session, {
    method: 'DELETE',
  });
}

/* Career roles */
export function getCareerRoles() {
  return apiRequest('/api/career-roles');
}

export function getCareerRole(session, id) {
  return authorizedRequest(`/api/career-roles/${id}`, session);
}

export function saveCareerRole(session, careerRole, id) {
  return authorizedRequest(
    id ? `/api/industry-mentor/career-roles/${id}` : '/api/industry-mentor/career-roles',
    session,
    {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(careerRole),
    },
  );
}

export function deleteCareerRole(session, careerRole) {
  return saveCareerRole(session, { ...careerRole, isActive: false }, careerRole.id);
}

// ==========================================
// Auto-Evolve Roadmap (AI Proposals)
// ==========================================

export function generateProposals(session, careerRoleId) {
  return authorizedRequest(`/api/industry-mentor/auto-evolve/generate/${careerRoleId}`, session, {
    method: 'POST',
  });
}

export function getPendingProposals(session) {
  return authorizedRequest('/api/industry-mentor/auto-evolve/proposals', session);
}

export function approveProposal(session, id) {
  return authorizedRequest(`/api/industry-mentor/auto-evolve/proposals/${id}/approve`, session, {
    method: 'POST',
  });
}

export function rejectProposal(session, id) {
  return authorizedRequest(`/api/industry-mentor/auto-evolve/proposals/${id}/reject`, session, {
    method: 'POST',
  });
}

