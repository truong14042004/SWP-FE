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

export function uploadUserSkillEvidence(session, userSkillId, file) {
    const formData = new FormData();
    formData.append('File', file);

    return authorizedRequest(`/api/storage/user-skills/${userSkillId}/evidence`, session, {
        method: 'POST',
        body: formData,
    });
}

export function importUserSkillEvidenceFromUrl(session, userSkillId, payload) {
    return authorizedRequest(`/api/storage/user-skills/${userSkillId}/evidence/import-url`, session, {
        method: 'POST',
        body: JSON.stringify(payload),
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

export function getSignedUrl(session, objectName) {
    return authorizedRequest(`/api/storage/signed-url?objectName=${encodeURIComponent(objectName)}`, session);
}


