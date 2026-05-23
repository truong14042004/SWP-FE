import { useMemo } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number';
import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
  };

  return (
    <>
      <motion.header
        className="imentor-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <p className="imentor-hero-eyebrow">Industry Mentor</p>
        <h1 className="imentor-hero-title">
          Chào {mentorName.split(' ').find(w => /^[A-Za-zÀ-ỹ]/.test(w) && !/^\d+$/.test(w)) || mentorName}, sẵn sàng review portfolio?
        </h1>
        <p className="imentor-hero-lede">
          Review queue tổng hợp portfolio đã publish của sinh viên. Mỗi feedback
          structured giúp sinh viên hiểu chính xác cần cải thiện gì để sẵn sàng đi làm.
        </p>
      </motion.header>

      <motion.section
        className="imentor-stats"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="imentor-stat" variants={statVariants}>
          <span className="imentor-stat-label">Queue</span>
          <span className="imentor-stat-value">
            {loading ? '—' : <CountingNumber number={stats.queueSize} />}
          </span>
          <span className="imentor-stat-hint">Sinh viên có portfolio publish</span>
        </motion.div>
        <motion.div className="imentor-stat" variants={statVariants}>
          <span className="imentor-stat-label">Feedback đã gửi</span>
          <span className="imentor-stat-value">
            {loading ? '—' : <CountingNumber number={stats.feedbackGiven} />}
          </span>
          <span className="imentor-stat-hint">Tổng số review</span>
        </motion.div>
        <motion.div className="imentor-stat" variants={statVariants}>
          <span className="imentor-stat-label">Sinh viên đã review</span>
          <span className="imentor-stat-value">
            {loading ? '—' : <CountingNumber number={stats.studentsReviewed} />}
          </span>
          <span className="imentor-stat-hint">Unique students</span>
        </motion.div>
        <motion.div className="imentor-stat" variants={statVariants}>
          <span className="imentor-stat-label">Avg rating</span>
          <span className="imentor-stat-value">
            {loading || stats.avgRating == null ? (
              '—'
            ) : (
              <CountingNumber number={stats.avgRating} decimalPlaces={1} />
            )}
          </span>
          <span className="imentor-stat-hint">Trung bình rating đã đưa</span>
        </motion.div>
      </motion.section>

      <section className="imentor-section">
        <div className="imentor-section-head">
          <div>
            <h2 className="imentor-section-title">Review queue</h2>
            <p className="imentor-section-meta">
              Sinh viên mới publish portfolio gần đây
            </p>
          </div>
          <Button
            type="button"
            className="imentor-section-action"
            variant="link"
            onClick={onNavigateToQueue}
            hoverScale={1.02}
            tapScale={0.98}
          >
            Xem tất cả →
          </Button>
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
            <Fades holdDelay={60} inView={true}>
              {recentQueue.map((s) => (
                <motion.article
                  key={s.id}
                  className="imentor-card"
                  whileHover={{
                    y: -6,
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                    borderColor: 'var(--imentor-ink-muted)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
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
                    <Button
                      type="button"
                      className="imentor-btn-primary"
                      onClick={() => onSelectStudent(s.id)}
                      hoverScale={1.05}
                      tapScale={0.95}
                    >
                      Mở review
                    </Button>
                  </div>
                </motion.article>
              ))}
            </Fades>
          </div>
        )}
      </section>

      <section className="imentor-section">
        <div className="imentor-section-head">
          <div>
            <h2 className="imentor-section-title">Feedback gần đây</h2>
            <p className="imentor-section-meta">5 review mới nhất bạn đã gửi</p>
          </div>
          <Button
            type="button"
            className="imentor-section-action"
            variant="link"
            onClick={onNavigateToFeedback}
            hoverScale={1.02}
            tapScale={0.98}
          >
            Lịch sử đầy đủ →
          </Button>
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
            <Fades holdDelay={50} inView={true}>
              {recentFeedbacks.map((f) => (
                <FeedbackPreview
                  key={f.id}
                  feedback={f}
                  onClick={() => onSelectStudent(f.studentId)}
                />
              ))}
            </Fades>
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
    <motion.div
      className="imentor-feedback-item"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      whileHover={{
        x: 6,
        backgroundColor: 'rgba(0, 102, 204, 0.02)',
        paddingLeft: '12px',
        paddingRight: '12px',
        borderRadius: '8px',
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
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
    </motion.div>
  );
}

