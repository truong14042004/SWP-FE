import { authorizedRequest } from '../../api/http';

export function getSkills(session) {
    return authorizedRequest('/api/skills', session);
}

export function getUserSkills(session) {
    return authorizedRequest('/api/user-skills', session);
}

export function createUserSkill(session, payload) {
    return authorizedRequest('/api/user-skills', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateUserSkill(session, id, payload) {
    return authorizedRequest(`/api/user-skills/${id}`, session, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteUserSkill(session, id) {
    return authorizedRequest(`/api/user-skills/${id}`, session, {
        method: 'DELETE',
    });
}

/* Skill Gap APIs */

export function analyzeSkillGap(session, careerRoleId) {
    return authorizedRequest('/api/skill-gap/analyze', session, {
        method: 'POST',
        body: JSON.stringify({
            careerRoleId,
        }),
    });
}

export function getLatestSkillGap(session) {
    return authorizedRequest('/api/skill-gap/latest', session);
}

export function getSkillGapById(session, id) {
    return authorizedRequest(`/api/skill-gap/${id}`, session);
}