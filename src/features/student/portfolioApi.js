import { authorizedRequest } from '../../api/http';

export function getMyPortfolio(session) {
    return authorizedRequest('/api/portfolio/me', session);
}

export function createPortfolio(session, payload) {
    return authorizedRequest('/api/portfolio', session, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updatePortfolio(session, payload) {
    return authorizedRequest('/api/portfolio', session, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function publishPortfolio(session) {
    return authorizedRequest('/api/portfolio/publish', session, {
        method: 'POST',
    });
}