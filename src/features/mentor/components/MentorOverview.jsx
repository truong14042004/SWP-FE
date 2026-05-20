import { useMemo } from 'react';

function getInitials(name) {
  if (!name) return 'M';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function average(values) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function MentorOverview({
  reviewQueue,
  feedbacks,
  loading,
  mentorName,
  onNavigateToQueue,
  onNavigateToFeedback,
  onSelectStudent,
}) {
  const stats = useMemo(() => {
    const queueSize = reviewQueue.length;
    const feedbackGiven = feedbacks.length;
    const reviewedStudentIds = new Set(feedbacks.map((f) => f.studentId));
    const studentsReviewed = reviewedStudentIds.size;
    const avgRating = average(feedbacks.map((f) => f.rating));
    return { queueSize, feedbackGiven, studentsReviewed, avgRating };
  }, [reviewQueue, feedbacks]);

  const recentQueue = reviewQueue.slice(0, 6);
  const recentFeedbacks = feedbacks.slice(0, 5);

  return (
    <>
      <header className="imentor-hero">
        <p className="imentor-hero-eyebrow">Industry Mentor</p>
        <h1 className="imentor-hero-title">
          Chào {mentorName.split(' ').slice(-1)[0]}, sẵn sàng review portfolio?
        </h1>
        <p className="imentor-hero-lede">
          Review queue tổng hợp portfolio đã publish của sinh viên. Mỗi feedback
          structured giúp sinh viên hiểu chính xác cần cải thiện gì để sẵn sàng đi làm.
        </p>
      </header>

      <section className="imentor-stats">
        <div className="imentor-stat">
          <span className="imentor-stat-label">Queue</span>
          <span className="imentor-stat-value">{loading ? '—' : stats.queueSize}</span>
          <span className="imentor-stat-hint">Sinh viên có portfolio publish</span>
        </div>
        <div className="imentor-stat">
          <span className="imentor-stat-label">Feedback đã gửi</span>
          <span className="imentor-stat-value">{loading ? '—' : stats.feedbackGiven}</span>
          <span className="imentor-stat-hint">Tổng số review</span>
        </div>
        <div className="imentor-stat">
          <span className="imentor-stat-label">Sinh viên đã review</span>
          <span className="imentor-stat-value">{loading ? '—' : stats.studentsReviewed}</span>
          <span className="imentor-stat-hint">Unique students</span>
        </div>
        <div className="imentor-stat">
          <span className="imentor-stat-label">Avg rating</span>
          <span className="imentor-stat-value">
            {loading || stats.avgRating == null ? '—' : stats.avgRating.toFixed(1)}
          </span>
          <span className="imentor-stat-hint">Trung bình rating đã đưa</span>
        </div>
      </section>

      <section className="imentor-section">
        <div className="imentor-section-head">
          <div>
            <h2 className="imentor-section-title">Review queue</h2>
            <p className="imentor-section-meta">
              Sinh viên mới publish portfolio gần đây
            </p>
          </div>
          <button
            type="button"
            className="imentor-section-action"
            onClick={onNavigateToQueue}
          >
            Xem tất cả →
          </button>
        </div>

        {loading ? (
          <div className="imentor-loading">Đang tải review queue...</div>
        ) : recentQueue.length === 0 ? (
          <div className="imentor-empty">
            <p className="imentor-empty-title">Chưa có sinh viên cần review</p>
            <p className="imentor-empty-hint">
              Khi sinh viên publish portfolio, họ sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="imentor-card-grid">
            {recentQueue.map((s) => (
              <article key={s.id} className="imentor-card">
                <div className="imentor-card-row">
                  <div
                    className="imentor-avatar"
                    style={
                      s.avatarUrl
                        ? { backgroundImage: `url(${s.avatarUrl})` }
                        : undefined
                    }
                  >
                    {!s.avatarUrl && getInitials(s.fullName)}
                  </div>
                  <div>
                    <p className="imentor-card-name">{s.fullName}</p>
                    <p className="imentor-card-meta">{s.email}</p>
                  </div>
                </div>
                {s.portfolioTitle && (
                  <div className="imentor-card-portfolio">
                    <span className="imentor-card-portfolio-label">Portfolio</span>
                    <p className="imentor-card-portfolio-title">{s.portfolioTitle}</p>
                  </div>
                )}
                <div className="imentor-card-actions">
                  <button
                    type="button"
                    className="imentor-btn-primary"
                    onClick={() => onSelectStudent(s.id)}
                  >
                    Mở review
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="imentor-section">
        <div className="imentor-section-head">
          <div>
            <h2 className="imentor-section-title">Feedback gần đây</h2>
            <p className="imentor-section-meta">5 review mới nhất bạn đã gửi</p>
          </div>
          <button
            type="button"
            className="imentor-section-action"
            onClick={onNavigateToFeedback}
          >
            Lịch sử đầy đủ →
          </button>
        </div>

        {loading ? (
          <div className="imentor-loading">Đang tải feedback...</div>
        ) : recentFeedbacks.length === 0 ? (
          <div className="imentor-empty">
            <p className="imentor-empty-title">Chưa có feedback nào</p>
            <p className="imentor-empty-hint">
              Mở review queue để bắt đầu đánh giá sinh viên đầu tiên.
            </p>
          </div>
        ) : (
          <div className="imentor-detail-section" style={{ padding: '8px 24px' }}>
            {recentFeedbacks.map((f) => (
              <FeedbackPreview
                key={f.id}
                feedback={f}
                onClick={() => onSelectStudent(f.studentId)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function FeedbackPreview({ feedback, onClick }) {
  const readinessClass = feedback.jobReadinessLevel
    ? feedback.jobReadinessLevel.toLowerCase()
    : '';
  return (
    <div
      className="imentor-feedback-item"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="imentor-feedback-head">
        <strong>{feedback.studentFullName}</strong>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {feedback.rating != null && (
            <span className="imentor-feedback-rating">
              <strong>{feedback.rating}</strong>/5
            </span>
          )}
          {feedback.jobReadinessLevel && (
            <span className={`imentor-feedback-readiness ${readinessClass}`}>
              {feedback.jobReadinessLevel}
            </span>
          )}
        </div>
      </div>
      <p className="imentor-feedback-comment">{feedback.comment}</p>
      <span className="imentor-feedback-time">
        {new Date(feedback.createdAt).toLocaleString('vi-VN')}
      </span>
    </div>
  );
}
