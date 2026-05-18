export const userRoles = {
  admin: 'Admin',
  student: 'Student',
  academicCounselor: 'AcademicCounselor',
  industryMentor: 'IndustryMentor',
};

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

