import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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
  { id: 'general', label: 'Tá»•ng quĂ¡t', desc: 'Pháº£n há»“i chung' },
  { id: 'roadmap', label: 'Roadmap', desc: 'LiĂªn káº¿t lá»™ trĂ¬nh' },
  { id: 'skillgap', label: 'Skill Gap', desc: 'LiĂªn káº¿t bĂ¡o cĂ¡o gap' },
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
      next.feedbackText = 'Vui lĂ²ng nháº­p ná»™i dung feedback';
    } else if (form.feedbackText.trim().length < 50) {
      next.feedbackText = 'Feedback pháº£i cĂ³ Ă­t nháº¥t 50 kĂ½ tá»±';
    }

    if (form.rating !== 0 && (form.rating < 1 || form.rating > 5)) {
      next.rating = 'ÄĂ¡nh giĂ¡ pháº£i tá»« 1 Ä‘áº¿n 5 sao';
    }

    if (form.feedbackType === 'roadmap' && !form.roadmapId) {
      next.link = 'Sinh viĂªn chÆ°a cĂ³ roadmap Ä‘á»ƒ liĂªn káº¿t';
    }
    if (form.feedbackType === 'skillgap' && !form.skillGapReportId) {
      next.link = 'Sinh viĂªn chÆ°a cĂ³ bĂ¡o cĂ¡o skill gap Ä‘á»ƒ liĂªn káº¿t';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error('Vui lĂ²ng kiá»ƒm tra láº¡i thĂ´ng tin');
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
        toast.success('ÄĂ£ gá»­i feedback thĂ nh cĂ´ng');
        onClose();
      } else {
        toast.error(result?.error || 'KhĂ´ng thá»ƒ gá»­i feedback');
      }
    } catch (error) {
      toast.error(error.message || 'CĂ³ lá»—i xáº£y ra');
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const roadmapAvailable = !!roadmap;
  const skillGapAvailable = skillGapReports.length > 0;

  return (
    <div
      className="counselor-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="counselor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="counselor-modal-title"
      >
        <header className="counselor-modal-header">
          <h3 id="counselor-modal-title">Viáº¿t feedback</h3>
          <button
            type="button"
            className="counselor-modal-close"
            onClick={onClose}
            aria-label="ÄĂ³ng modal"
          >
            âœ•
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="counselor-modal-body">
            <div className="counselor-modal-recipient">
              <div className="counselor-student-avatar" aria-hidden>
                {getInitials(student.fullName)}
              </div>
              <div>
                <strong>{student.fullName}</strong>
                <small>{student.email}</small>
              </div>
            </div>

            {/* Feedback Type selector */}
            <div className="counselor-form-group">
              <label>LiĂªn káº¿t vá»›i</label>
              <div
                className="counselor-feedback-type-selector"
                role="radiogroup"
                aria-label="Loáº¡i feedback"
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
                            ? 'Sinh viĂªn chÆ°a cĂ³ roadmap'
                            : 'Sinh viĂªn chÆ°a cĂ³ bĂ¡o cĂ¡o skill gap'
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
                  Äang táº£i dá»¯ liá»‡u liĂªn káº¿t...
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
                      {formatShortDate(report.createdAt)} Â·{' '}
                      {Math.round(Number(report.matchScore))}% Â·{' '}
                      {report.careerRoleName}
                    </option>
                  ))}
                </select>
              )}

              {/* Roadmap info when type === roadmap */}
              {form.feedbackType === 'roadmap' && roadmap && (
                <div className="counselor-feedback-link-info">
                  đŸ“‹ {roadmap.title} Â· {Math.round(Number(roadmap.progress) || 0)}% hoĂ n thĂ nh
                </div>
              )}

              {errors.link && (
                <span className="counselor-form-error">{errors.link}</span>
              )}
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-rating">ÄĂ¡nh giĂ¡ tá»•ng thá»ƒ</label>
              <div
                className="counselor-rating-input"
                role="radiogroup"
                id="counselor-rating"
                aria-label="Chá»n sá»‘ sao Ä‘Ă¡nh giĂ¡"
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
                    â˜…
                  </button>
                ))}
              </div>
              <div className="counselor-form-row">
                <span className="counselor-form-hint">
                  {form.rating > 0 ? `${form.rating}/5 sao` : 'TĂ¹y chá»n'}
                </span>
                {errors.rating && (
                  <span className="counselor-form-error">{errors.rating}</span>
                )}
              </div>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-feedback-text">Ná»™i dung feedback *</label>
              <textarea
                id="counselor-feedback-text"
                value={form.feedbackText}
                onChange={(e) => updateField('feedbackText', e.target.value)}
                placeholder="Viáº¿t pháº£n há»“i chi tiáº¿t cho sinh viĂªn (Ă­t nháº¥t 50 kĂ½ tá»±)..."
                rows={6}
                required
              />
              <div className="counselor-form-row">
                <span className="counselor-form-hint">
                  {form.feedbackText.length}/50 kĂ½ tá»± tá»‘i thiá»ƒu
                </span>
                {errors.feedbackText && (
                  <span className="counselor-form-error">
                    {errors.feedbackText}
                  </span>
                )}
              </div>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-recommendations">Khuyáº¿n nghá»‹</label>
              <textarea
                id="counselor-recommendations"
                value={form.recommendations}
                onChange={(e) => updateField('recommendations', e.target.value)}
                placeholder="CĂ¡c bÆ°á»›c tiáº¿p theo sinh viĂªn nĂªn thá»±c hiá»‡n..."
                rows={3}
              />
              <span className="counselor-form-hint">
                TĂ¹y chá»n â€” sinh viĂªn sáº½ tháº¥y pháº§n nĂ y
              </span>
            </div>

            <div className="counselor-form-group">
              <label htmlFor="counselor-private-notes">Ghi chĂº riĂªng</label>
              <textarea
                id="counselor-private-notes"
                value={form.privateNotes}
                onChange={(e) => updateField('privateNotes', e.target.value)}
                placeholder="Ghi chĂº cĂ¡ nhĂ¢n khĂ´ng hiá»ƒn thá»‹ vá»›i sinh viĂªn..."
                rows={2}
                className="counselor-private-textarea"
              />
              <div className="counselor-form-warning">
                <span aria-hidden>â ï¸</span>
                <span>Sinh viĂªn khĂ´ng nhĂ¬n tháº¥y pháº§n nĂ y</span>
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
              Há»§y
            </button>
            <button
              type="submit"
              className="counselor-btn counselor-btn-primary"
              disabled={saving}
            >
              {saving ? 'Äang gá»­i...' : 'Gá»­i feedback'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
