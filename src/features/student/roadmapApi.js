import { authorizedRequest } from '../../api/http';

export function getRoadmaps(session) {
    return authorizedRequest('/api/roadmap', session);
}

export function getRoadmapById(session, id) {
    return authorizedRequest(`/api/roadmap/${id}`, session);
}

export function generateRoadmap(session, payload) {
    return authorizedRequest('/api/roadmap/generate', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateRoadmapNodeStatus(session, id, status) {
    return authorizedRequest(`/api/roadmap-node/${id}/status`, session, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
}

export function getLessonProgress(session, roadmapId) {
    return authorizedRequest(`/api/roadmap/${roadmapId}/lesson-progress`, session);
}

export function markLessonCompleted(session, nodeId, lessonId) {
    return authorizedRequest(
        `/api/roadmap-node/${nodeId}/lessons/${lessonId}/complete`,
        session,
        { method: 'POST' }
    );
}

export function unmarkLessonCompleted(session, nodeId, lessonId) {
    return authorizedRequest(
        `/api/roadmap-node/${nodeId}/lessons/${lessonId}/complete`,
        session,
        { method: 'DELETE' }
    );
}

export function regenerateRoadmap(session, id) {
    return authorizedRequest(`/api/roadmap/${id}/regenerate`, session, {
        method: 'POST',
    });
}
