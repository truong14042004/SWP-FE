import { authorizedRequest } from '../../../api/http';

export function getCounselorStudents(session) {
  return authorizedRequest('/api/counselor/students', session);
}

export function getStudentProfile(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/profile`, session);
}

export function getStudentSkills(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/skills`, session);
}

export function getStudentSkillGapLatest(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/skill-gap/latest`, session);
}

export function getStudentSkillGapHistory(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/skill-gaps`, session);
}

export function getStudentSkillGapById(session, studentId, reportId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/skill-gap/${reportId}`, session);
}

export function getStudentRoadmap(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/roadmap`, session);
}

export function getMyFeedbacks(session) {
  return authorizedRequest('/api/counselor/feedback', session);
}

export function getStudentFeedbacks(session, studentId) {
  return authorizedRequest(`/api/counselor/students/${studentId}/feedback`, session);
}

export function createFeedback(session, payload) {
  return authorizedRequest('/api/counselor/feedback', session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSignedUrl(session, objectName) {
  return authorizedRequest(
    `/api/storage/signed-url?objectName=${encodeURIComponent(objectName)}`,
    session
  );
}
