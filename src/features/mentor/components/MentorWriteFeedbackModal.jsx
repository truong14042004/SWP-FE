import { useEffect, useState } from 'react';
import { getStudentQuota } from '../api/industryMentorApi';

const READINESS_OPTIONS = [
  { value: 'NotReady', label: 'Not Ready', hint: 'Cần học thêm nền tảng' },
  { value: 'NeedsImprovement', label: 'Needs Improvement', hint: 'Có cơ bản, cần cải thiện' },
  { value: 'Ready', label: 'Ready', hint: 'Sẵn sàng đi làm' },
  { value: 'Excellent', label: 'Excellent', hint: 'Vượt mong đợi' },
];

export function MentorWriteFeedbackModal({ session, student, onClose, onSubmit }) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(null);
  const [portfolioQualityFeedback, setPortfolioQualityFeedback] = useState('');
  const [technicalSkillsAssessment, setTechnicalSkillsAssessment] = useState('');
  const [projectQualityFeedback, setProjectQualityFeedback] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [jobReadinessLevel, setJobReadinessLevel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getStudentQuota(session, student.id)
      .then((q) => {
        if (!cancelled) setQuota(q);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session, student.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Comment là bắt buộc');
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      studentId: student.id,
      comment: comment.trim(),
      rating: rating ?? null,
      portfolioQualityFeedback: portfolioQualityFeedback.trim() || null,
      technicalSkillsAssessment: technicalSkillsAssessment.trim() || null,
      projectQualityFeedback: projectQualityFeedback.trim() || null,
      recommendations: recommendations.trim() || null,
      jobReadinessLevel: jobReadinessLevel || null,
    });
    setSubmitting(false);

    if (!result?.success) {
      setError(result?.error || 'Không thể gửi feedback');
    }
  }

  const isQuotaEmpty = quota?.remaining === 0;

  return (
    <div className="imentor-modal-backdrop" role="dialog" aria-modal="true">
      <div className="imentor-modal">
        <div className="imentor-modal-head">
          <div>
            <h2 className="imentor-modal-title">Gửi feedback cho {student.fullName}</h2>
            <p className="imentor-modal-subtitle">
              Đánh giá structured giúp sinh viên hiểu rõ điểm mạnh, gap, và bước cải thiện
              tiếp theo.
            </p>
          </div>
          <button
            type="button"
            className="imentor-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="imentor-modal-body">
            {error && <p className="imentor-form-error">{error}</p>}

            {isQuotaEmpty && (
              <p className="imentor-form-error">
                Sinh viên đã hết quota review ({quota.used}/{quota.limit}). Họ cần
                nâng cấp gói trước khi nhận feedback mới.
              </p>
            )}

            <div className="imentor-form-row">
              <label htmlFor="imentor-comment">
                Nhận xét tổng quan <span style={{ color: '#c52a2a' }}>*</span>
              </label>
              <p className="imentor-hint">
                Tóm tắt ngắn về portfolio, điểm nổi bật và mức độ trưởng thành.
              </p>
              <textarea
                id="imentor-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="VD: Portfolio của bạn rõ ràng, có 3 project tốt. Tuy nhiên cần..."
                disabled={submitting}
                required
              />
            </div>

            <div className="imentor-form-row">
              <label>Overall rating</label>
              <div className="imentor-rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={rating === n ? 'active' : ''}
                    onClick={() => setRating(rating === n ? null : n)}
                    disabled={submitting}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="imentor-form-row">
              <label htmlFor="imentor-portfolio-quality">Portfolio quality</label>
              <p className="imentor-hint">Cấu trúc, trình bày, story telling.</p>
              <textarea
                id="imentor-portfolio-quality"
                value={portfolioQualityFeedback}
                onChange={(e) => setPortfolioQualityFeedback(e.target.value)}
                placeholder="VD: Layout tốt, nhưng phần About còn ngắn..."
                disabled={submitting}
              />
            </div>

            <div className="imentor-form-row">
              <label htmlFor="imentor-tech-skills">Technical skills assessment</label>
              <p className="imentor-hint">
                Đánh giá kỹ năng kỹ thuật dựa trên repo, code quality, kiến trúc.
              </p>
              <textarea
                id="imentor-tech-skills"
                value={technicalSkillsAssessment}
                onChange={(e) => setTechnicalSkillsAssessment(e.target.value)}
                placeholder="VD: Code clean, biết dùng patterns. Cần học thêm về testing..."
                disabled={submitting}
              />
            </div>

            <div className="imentor-form-row">
              <label htmlFor="imentor-project-quality">Project quality</label>
              <p className="imentor-hint">Scope, độ hoàn thiện, độ phức tạp.</p>
              <textarea
                id="imentor-project-quality"
                value={projectQualityFeedback}
                onChange={(e) => setProjectQualityFeedback(e.target.value)}
                placeholder="VD: 2 project có README tốt, 1 project chưa deploy..."
                disabled={submitting}
              />
            </div>

            <div className="imentor-form-row">
              <label htmlFor="imentor-recommendations">Recommendations</label>
              <p className="imentor-hint">3-5 hành động cụ thể trong 1-2 tháng tới.</p>
              <textarea
                id="imentor-recommendations"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="VD: 1. Viết unit test cho project chính... 2. Deploy lên Vercel..."
                disabled={submitting}
              />
            </div>

            <div className="imentor-form-row">
              <label>Job readiness level</label>
              <div className="imentor-readiness-grid">
                {READINESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={jobReadinessLevel === opt.value ? 'active' : ''}
                    onClick={() =>
                      setJobReadinessLevel(
                        jobReadinessLevel === opt.value ? '' : opt.value,
                      )
                    }
                    disabled={submitting}
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="imentor-modal-foot">
            <span className="imentor-modal-quota">
              {quota
                ? (
                  <>
                    Quota: <strong>{quota.remaining}</strong>/{quota.limit} ({quota.planName})
                  </>
                )
                : 'Đang tải quota...'}
            </span>
            <div className="imentor-modal-actions">
              <button
                type="button"
                className="imentor-btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="imentor-btn-primary"
                disabled={submitting || isQuotaEmpty || !comment.trim()}
              >
                {submitting ? 'Đang gửi...' : 'Gửi feedback'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
