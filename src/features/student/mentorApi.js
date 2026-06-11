import { authorizedRequest } from '../../api/http';

export function sendMentorMessage(session, payload) {
    return authorizedRequest('/api/mentor/chat', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function getMentorSessions(session) {
    return authorizedRequest('/api/mentor/sessions', session);
}

export function getMentorSessionById(session, id) {
    return authorizedRequest(`/api/mentor/sessions/${id}`, session);
}

export function getMentorChatQuota(session) {
    return authorizedRequest('/api/mentor/quota', session);
}

export function applyAiRoadmap(session, roadmap) {
    return authorizedRequest('/api/ai-mentor/apply-roadmap', session, {
        method: 'POST',
        body: JSON.stringify({ roadmap }),
    });
}

export function getStudentRoadmapApprovalRequests(session) {
    return authorizedRequest('/api/ai-mentor/roadmap-approval-requests', session);
}