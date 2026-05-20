import { authorizedRequest } from '../../api/http';

export function getAvailableReviewers(session, nodeId) {
  return authorizedRequest(`/api/roadmap-node/${nodeId}/available-reviewers`, session);
}

export function getReviewRequestsForNode(session, nodeId) {
  return authorizedRequest(`/api/roadmap-node/${nodeId}/review-requests`, session);
}

export function createReviewRequest(session, nodeId, payload) {
  return authorizedRequest(`/api/roadmap-node/${nodeId}/review-requests`, session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelReviewRequest(session, requestId) {
  return authorizedRequest(`/api/roadmap-node/review-requests/${requestId}/cancel`, session, {
    method: 'POST',
  });
}

export function uploadRoadmapEvidence(session, file) {
  const formData = new FormData();
  formData.append('file', file);

  return authorizedRequest('/api/storage/roadmap-evidence', session, {
    method: 'POST',
    body: formData,
  });
}

// Reviewer side
export function getMentorRoadmapQueue(session) {
  return authorizedRequest('/api/industry-mentor/roadmap-review-queue', session);
}

export function getCounselorRoadmapQueue(session) {
  return authorizedRequest('/api/counselor/roadmap-review-queue', session);
}

export function approveReviewRequest(session, requestId, payload = {}) {
  return authorizedRequest(`/api/roadmap-node/review-requests/${requestId}/approve`, session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function rejectReviewRequest(session, requestId, payload) {
  return authorizedRequest(`/api/roadmap-node/review-requests/${requestId}/reject`, session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
