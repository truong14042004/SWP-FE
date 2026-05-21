import { apiRequest, authorizedRequest } from '../../api/http';

export function getStudentProfile(session) {
  return authorizedRequest('/api/profile', session);
}

export function uploadStudentAvatar(session, file) {
  const formData = new FormData();
  formData.append('File', file);

  return authorizedRequest('/api/storage/avatar', session, {
    method: 'POST',
    body: formData,
  });
}

export function uploadStudentCv(session, file) {
  const formData = new FormData();
  formData.append('File', file);

  return authorizedRequest('/api/profile/cv', session, {
    method: 'POST',
    body: formData,
  });
}

export function importStudentAvatarFromUrl(session, payload) {
  return authorizedRequest('/api/storage/avatar/import-url', session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createStudentProfile(session, payload) {
  return authorizedRequest('/api/profile', session, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateStudentProfile(session, payload) {
  return authorizedRequest('/api/profile', session, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getCareerRoles() {
  return apiRequest('/api/career-roles');
}

export async function loadStudentProfileData(session) {
  const [careerRoles, profileResult] = await Promise.all([
    getCareerRoles().catch(() => []),
    getStudentProfile(session).then((profile) => ({ profile, hasProfile: true })).catch((error) => {
      if (error?.status === 404) {
        return { profile: null, hasProfile: false };
      }
      throw error;
    }),
  ]);

  return {
    careerRoles,
    profile: profileResult.profile,
    hasProfile: profileResult.hasProfile,
  };
}
