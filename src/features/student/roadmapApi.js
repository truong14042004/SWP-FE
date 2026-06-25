import { authorizedRequest } from '../../api/http';
import { apiUrl } from '../../config';
import { getSessionToken, getStoredSession } from '../../auth/session';

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
function getFileNameFromContentDisposition(disposition) {
    if (!disposition) return '';

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {
            return utf8Match[1];
        }
    }

    const normalMatch = disposition.match(/filename="?([^";]+)"?/i);
    return normalMatch?.[1] || '';
}

function getExtensionFromContentType(contentType) {
    const lower = String(contentType || '').toLowerCase();

    if (lower === 'application/pdf') return '.pdf';
    if (lower === 'application/zip' || lower === 'application/x-zip-compressed') return '.zip';
    if (lower.includes('word')) return '.docx';
    if (lower.includes('excel') || lower.includes('spreadsheet')) return '.xlsx';
    if (lower.includes('powerpoint') || lower.includes('presentation')) return '.pptx';
    if (lower.startsWith('image/png')) return '.png';
    if (lower.startsWith('image/jpeg')) return '.jpg';

    return '';
}

function getFallbackDownloadFileName(resource, response) {
    if (resource?.fileName) return resource.fileName;

    const title = resource?.title || resource?.skillName || 'learning-resource';
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '-').trim();

    const contentType =
        response.headers.get('content-type') ||
        resource?.contentType ||
        '';

    const extension = getExtensionFromContentType(contentType);

    if (extension && !safeTitle.toLowerCase().endsWith(extension)) {
        return `${safeTitle}${extension}`;
    }

    return safeTitle || `learning-resource${extension}`;
}

export async function downloadLearningResourceFile(session, resource) {
    const resourceId = typeof resource === 'string' ? resource : resource?.id;

    if (!resourceId) {
        throw new Error('Không tìm thấy ID tài nguyên để tải.');
    }

    if (!apiUrl) {
        throw new Error('Thiếu cấu hình VITE_API_URL.');
    }

    const activeSession = getStoredSession() || session;
    const token = getSessionToken(activeSession);

    const response = await fetch(
        `${apiUrl}/api/storage/learning-resources/${resourceId}/download`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        let message = 'Không tải được tệp.';

        try {
            const payload = await response.json();
            message = payload?.message || message;
        } catch {
            // ignore non-json error response
        }

        throw new Error(message);
    }

    const blob = await response.blob();

    const disposition = response.headers.get('content-disposition') || '';
    const fileName =
        getFileNameFromContentDisposition(disposition) ||
        getFallbackDownloadFileName(resource, response);

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(objectUrl);
}