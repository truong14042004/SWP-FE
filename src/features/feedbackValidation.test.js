import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCounselorFeedbackForm,
  validateMentorFeedbackForm,
} from './feedbackValidation.js';

const longFeedback = 'This feedback has enough detail to pass the minimum length rule.';

test('mentor feedback requires a detailed comment', () => {
  assert.deepEqual(validateMentorFeedbackForm({ comment: 'Too short' }), {
    comment: 'Nhan xet phai co it nhat 50 ky tu',
  });
});

test('mentor feedback rejects invalid rating and readiness values', () => {
  assert.deepEqual(
    validateMentorFeedbackForm({
      comment: longFeedback,
      rating: 6,
      jobReadinessLevel: 'AlmostReady',
    }),
    {
      rating: 'Danh gia phai tu 1 den 5 sao',
      jobReadinessLevel: 'Muc do san sang khong hop le',
    },
  );
});

test('mentor feedback blocks submit when quota is empty', () => {
  assert.deepEqual(
    validateMentorFeedbackForm({ comment: longFeedback }, { isQuotaEmpty: true }),
    { quota: 'Sinh vien da het quota review' },
  );
});

test('counselor feedback requires detailed feedback text', () => {
  assert.deepEqual(validateCounselorFeedbackForm({ feedbackText: 'Short' }), {
    feedbackText: 'Feedback phai co it nhat 50 ky tu',
  });
});

test('counselor feedback requires selected roadmap link to exist', () => {
  assert.deepEqual(
    validateCounselorFeedbackForm(
      { feedbackText: longFeedback, feedbackType: 'roadmap', roadmapId: null },
      { roadmapAvailable: false },
    ),
    { link: 'Sinh vien chua co roadmap de lien ket' },
  );
});

test('counselor feedback accepts a valid general payload', () => {
  assert.deepEqual(
    validateCounselorFeedbackForm({
      feedbackText: longFeedback,
      feedbackType: 'general',
      rating: 5,
    }),
    {},
  );
});

