import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent } from '@/components/animate-ui/components/radix/dialog';
import { validateCounselorFeedbackForm } from '../../feedbackValidation';
import {
  getStudentRoadmap,
  getStudentSkillGapHistory,
} from '../api/counselorApi';

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'S'
  );
}

function formatShortDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const EMPTY_FORM = {
  feedbackText: '',
  rating: 0,
  recommendations: '',
  privateNotes: '',
  feedbackType: 'general',
  roadmapId: null,
  skillGapReportId: null,
};

const FEEDBACK_TYPES = [
  { id: 'general', label: 'Tổng quát', desc: 'Phản hồi chung' },
  { id: 'roadmap', label: 'Roadmap', desc: 'Liên kết lộ trình' },
  { id: 'skillgap', label: 'Skill Gap', desc: 'Liên kết báo cáo gap' },
];

export function CounselorWriteFeedbackModal({ session, student, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [roadmap, setRoadmap] = useState(null);
  const [skillGapReports, setSkillGapReports] = useState([]);
  const [linkingDataLoading, setLinkingDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLinking() {
      setLinkingDataLoading(true);
      try {
        const [rm, gaps] = await Promise.all([
          getStudentRoadmap(session, student.id).catch(() => null),
          getStudentSkillGapHistory(session, student.id).catch(() => []),
        ]);
        if (cancelled) return;
        setRoadmap(rm);
        setSkillGapReports(Array.isArray(gaps) ? gaps : []);
      } finally {
        if (!cancelled) setLinkingDataLoading(false);
      }
    }

    loadLinking();
    return () => {
      cancelled = true;
    };
  }, [session, student.id]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  function setFeedbackType(type) {
    setForm((prev) => ({
      ...prev,
      feedbackType: type,
      roadmapId: type === 'roadmap' ? roadmap?.id || null : null,
      skillGapReportId:
        type === 'skillgap' ? skillGapReports[0]?.id || null : null,
    }));
    setErrors((prev) => ({ ...prev, link: null }));
  }

  function validate() {
    const next = {};

    if (!form.feedbackText.trim()) {
      next.feedbackText = 'Vui lòng nhập nội dung feedback';
    } else if (form.feedbackText.trim().length < 50) {
      next.feedbackText = 'Feedback phải có ít nhất 50 ký tự';
    }

    if (form.rating !== 0 && (form.rating < 1 || form.rating > 5)) {
      next.rating = 'Đánh giá phải từ 1 đến 5 sao';
    }

    if (form.feedbackType === 'roadmap' && !form.roadmapId) {
      next.link = 'Sinh viên chưa có roadmap để liên kết';
    }
    if (form.feedbackType === 'skillgap' && !form.skillGapReportId) {
      next.link = 'Sinh viên chưa có báo cáo skill gap để liên kết';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        studentId: student.id,
        feedbackText: form.feedbackText.trim(),
        rating: form.rating || null,
        recommendations: form.recommendations.trim() || null,
        privateNotes: form.privateNotes.trim() || null,
        roadmapId: form.feedbackType === 'roadmap' ? form.roadmapId : null,
        skillGapReportId:
          form.feedbackType === 'skillgap' ? form.skillGapReportId : null,
      };

      const result = await onSubmit(payload);
      if (result?.success) {
        toast.success('Đã gửi feedback thành công');
        onClose();
      } else {
        toast.error(result?.error || 'Không thể gửi feedback');
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const roadmapAvailable = !!roadmap;
  const skillGapAvailable = skillGapReports.length > 0;
  const currentErrors = validateCounselorFeedbackForm(form, {
    roadmapAvailable,
    skillGapAvailable,
  });
  const canSubmit = !saving && Object.keys(currentErrors).length === 0;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[750px] p-0 overflow-hidden border-none bg-transparent shadow-none" showCloseButton={false}>
        <div
          className="counselor-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="counselor-modal-title"
          style={{ margin: 0, width: '100%', maxWidth: 'none' }}
        >
          <header className="counselor-modal-header">
            <h3 id="counselor-modal-title">Viết feedback</h3>
            <button
              type="button"
              className="counselor-modal-close"
              onClick={onClose}
              aria-label="Đóng modal"
            >
              ✕
            </button>
          </header>

        <form onSubmit={handleSubmit}>
          <div className="counselor-modal-body">
            <div className="counselor-modal-recipient">
              <div className="counselor-avatar" aria-hidden>
                {getInitials(student.fullName)}
              </div>
              <div>
                <strong>{student.fullName}</strong>
                <small>{student.email}</small>
              </div>
            </div>

            {/* Feedback Type selector */}
            <div className="counselor-form-group">
              <label>Liên kết với</label>
              <div
                className="counselor-feedback-type-selector"
                role="radiogroup"
                aria-label="Loại feedback"
              >
                {FEEDBACK_TYPES.map((type) => {
                  const disabled =
                    (type.id === 'roadmap' && !roadmapAvailable) ||
                    (type.id === 'skillgap' && !skillGapAvailable);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      role="radio"
                      aria-checked={form.feedbackType === type.id}
                      disabled={disabled || linkingDataLoading}
                      className={`counselor-feedback-type-option ${
                        form.feedbackType === type.id ? 'active' : ''
                      }`}
                      onClick={() => setFeedbackType(type.id)}
                      title={
                        disabled
                          ? type.id === 'roadmap'
                            ? 'Sinh viên chưa có roadmap'
                            : 'Sinh viên chưa có báo cáo skill gap'
                          : undefined
                      }
                    >
                      <strong>{type.label}</strong>
                      <small>{type.desc}</small>
                    </button>
                  );
                })}
              </div>
              {linkingDataLoading && (
                <span className="counselor-form-hint">
                  Đang tải dữ liệu liên kết...
                </span>
              )}

              {/* Skill Gap dropdown when type === skillgap */}
              {form.feedbackType === 'skillgap' && skillGapReports.length > 0 && (
                <select
                  className="counselor-feedback-link-select"
                  value={form.skillGapReportId || ''}
                  onChange={(e) =>
                    updateField('skillGapReportId', e.target.value)
                  }
                >
                  {skillGapReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {formatShortDate(report.createdAt)} ·{' '}
                      {Math.round(Number(report.matchScore))}% ·{' '}
                      {report.careerRoleName}
                    </option>
                  ))}
                </select>
              )}

              {/* Roadmap info when type === roadmap */}
              {form.feedbackType === 'roadmap' && roadmap && (
                <div className="counselor-feedback-link-info">
                  ▸ {roadmap.title} · {Math.round(Number(roadmap.progress) || 0)}% hoàn thành
                </div>
              )}

              {errors.link && (
                <span className="counselor-form-error">{errors.link}</span>
              )}
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-rating">Đánh giá tổng thể</label>
              <div
                className="counselor-rating-input"
                role="radiogroup"
                id="counselor-rating"
                aria-label="Chọn số sao đánh giá"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={star === form.rating}
                    aria-label={`${star} sao`}
                    className={`counselor-rating-star ${
                      star <= form.rating ? 'active' : ''
                    }`}
                    onClick={() => updateField('rating', star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="counselor-form-row">
                <span className="counselor-form-hint">
                  {form.rating > 0 ? `${form.rating}/5 sao` : 'Tùy chọn'}
                </span>
                {errors.rating && (
                  <span className="counselor-form-error">{errors.rating}</span>
                )}
              </div>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-feedback-text">Nội dung feedback *</label>
              <textarea
                id="counselor-feedback-text"
                value={form.feedbackText}
                onChange={(e) => updateField('feedbackText', e.target.value)}
                placeholder="Viết phản hồi chi tiết cho sinh viên (ít nhất 50 ký tự)..."
                rows={6}
                required
              />
              <div className="counselor-form-row">
                <span className="counselor-form-hint">
                  {form.feedbackText.length}/50 ký tự tối thiểu
                </span>
                {errors.feedbackText && (
                  <span className="counselor-form-error">
                    {errors.feedbackText}
                  </span>
                )}
              </div>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-recommendations">Khuyến nghị</label>
              <textarea
                id="counselor-recommendations"
                value={form.recommendations}
                onChange={(e) => updateField('recommendations', e.target.value)}
                placeholder="Các bước tiếp theo sinh viên nên thực hiện..."
                rows={3}
              />
              <span className="counselor-form-hint">
                Tùy chọn — sinh viên sẽ thấy phần này
              </span>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-private-notes">Ghi chú riêng</label>
              <textarea
                id="counselor-private-notes"
                value={form.privateNotes}
                onChange={(e) => updateField('privateNotes', e.target.value)}
                placeholder="Ghi chú cá nhân không hiển thị với sinh viên..."
                rows={2}
                className="counselor-private-textarea"
              />
              <div className="counselor-form-warning">
                <span aria-hidden>⚠</span>
                <span>Sinh viên không nhìn thấy phần này</span>
              </div>
            </div>
          </div>

          <footer className="counselor-modal-footer">
            <button
              type="button"
              className="counselor-btn counselor-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="counselor-btn counselor-btn-primary"
              disabled={!canSubmit}
            >
              {saving ? 'Đang gửi...' : 'Gửi feedback'}
            </button>
          </footer>
        </form>
      </div>
    </DialogContent>
  </Dialog>
  );
}
