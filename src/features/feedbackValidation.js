export const MIN_FEEDBACK_LENGTH = 50;

export const VALID_JOB_READINESS_LEVELS = [
  'NotReady',
  'NeedsImprovement',
  'Ready',
  'Excellent',
];

function trimmedLength(value) {
  return String(value || '').trim().length;
}

function hasInvalidRating(value) {
  return value != null && value !== 0 && (value < 1 || value > 5);
}

export function validateMentorFeedbackForm(form, { isQuotaEmpty = false } = {}) {
  const errors = {};

  if (!trimmedLength(form.comment)) {
    errors.comment = 'Vui long nhap nhan xet tong quan';
  } else if (trimmedLength(form.comment) < MIN_FEEDBACK_LENGTH) {
    errors.comment = `Nhan xet phai co it nhat ${MIN_FEEDBACK_LENGTH} ky tu`;
  }

  if (hasInvalidRating(form.rating)) {
    errors.rating = 'Danh gia phai tu 1 den 5 sao';
  }

  if (
    form.jobReadinessLevel
    && !VALID_JOB_READINESS_LEVELS.includes(form.jobReadinessLevel)
  ) {
    errors.jobReadinessLevel = 'Muc do san sang khong hop le';
  }

  if (isQuotaEmpty) {
    errors.quota = 'Sinh vien da het quota review';
  }

  return errors;
}

export function validateCounselorFeedbackForm(
  form,
  { roadmapAvailable = false, skillGapAvailable = false } = {},
) {
  const errors = {};

  if (!trimmedLength(form.feedbackText)) {
    errors.feedbackText = 'Vui long nhap noi dung feedback';
  } else if (trimmedLength(form.feedbackText) < MIN_FEEDBACK_LENGTH) {
    errors.feedbackText = `Feedback phai co it nhat ${MIN_FEEDBACK_LENGTH} ky tu`;
  }

  if (hasInvalidRating(form.rating)) {
    errors.rating = 'Danh gia phai tu 1 den 5 sao';
  }

  if (form.feedbackType === 'roadmap' && (!roadmapAvailable || !form.roadmapId)) {
    errors.link = 'Sinh vien chua co roadmap de lien ket';
  }

  if (form.feedbackType === 'skillgap' && (!skillGapAvailable || !form.skillGapReportId)) {
    errors.link = 'Sinh vien chua co bao cao skill gap de lien ket';
  }

  return errors;
}

