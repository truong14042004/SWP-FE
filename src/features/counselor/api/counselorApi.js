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

/* ── Luồng 1: Duyệt kỹ năng (skill verification) ─────────────── */

export function getSkillVerificationQueue(session) {
  return authorizedRequest('/api/counselor/skill-verification-queue', session);
}

export function verifyStudentSkill(session, userSkillId, payload) {
  return authorizedRequest(`/api/user-skills/${userSkillId}/verify`, session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function unverifyStudentSkill(session, userSkillId) {
  return authorizedRequest(`/api/user-skills/${userSkillId}/unverify`, session, {
    method: 'POST',
  });
}

export function rejectStudentSkillEvidence(session, userSkillId, reason) {
  return authorizedRequest(`/api/user-skills/${userSkillId}/reject-evidence`, session, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/* ── Luồng 2: Duyệt khung lộ trình (roadmap approval) ────────── */

export function getRoadmapApprovalQueue(session) {
  return authorizedRequest('/api/counselor/roadmap-approval-queue', session);
}

export function getRoadmapApprovalRequestDetails(session, requestId) {
  return authorizedRequest(`/api/counselor/roadmap-approval-requests/${requestId}`, session);
}

export function approveRoadmapRequest(session, requestId) {
  return authorizedRequest(`/api/counselor/roadmap-approval-requests/${requestId}/approve`, session, {
    method: 'POST',
  });
}

export function rejectRoadmapRequest(session, requestId, rejectionReason) {
  return authorizedRequest(`/api/counselor/roadmap-approval-requests/${requestId}/reject`, session, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  });
}
