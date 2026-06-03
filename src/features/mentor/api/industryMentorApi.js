import { authorizedRequest } from '../../../api/http';

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

