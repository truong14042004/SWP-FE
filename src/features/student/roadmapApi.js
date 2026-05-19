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