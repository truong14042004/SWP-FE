import { authorizedRequest } from '../../api/http';


export function startGithubLogin(session, payload) {
    return authorizedRequest('/api/github/oauth/login', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function handleGithubCallback(session, params) {
    const searchParams = new URLSearchParams();

    if (params.code) searchParams.set('code', params.code);
    if (params.state) searchParams.set('state', params.state);
    if (params.error) searchParams.set('error', params.error);

    return authorizedRequest(`/api/github/oauth/callback?${searchParams.toString()}`, session);
}

export function syncGithubRepositories(session, payload) {
    return authorizedRequest('/api/github/sync', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function getGithubRepositories(session) {
    return authorizedRequest('/api/github/repositories', session);
}

export function getGithubConnection(session) {
    return authorizedRequest('/api/github/connection', session);
}

export function disconnectGithub(session) {
    return authorizedRequest('/api/github/connection', session, {
        method: 'DELETE',
    });
}

export function analyzeGithubReadme(session, payload) {
    return authorizedRequest('/api/github/analyze-readme', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}