import { useMemo } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';
import { AnimateNumber as MotionNumber } from 'motion-number';

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

function formatRelativeTime(date) {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
}

function getMatchScoreClass(score) {
  if (score == null) return 'muted';
  const n = Number(score);
  if (n >= 75) return 'strong';
  if (n >= 60) return 'medium';
  return 'weak';
}

function renderStars(rating = 0) {
  return Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`counselor-feedback-star ${i < (rating || 0) ? '' : 'empty'}`}
    >
      ★
    </span>
  ));
}

export function CounselorOverview({
  students = [],
  feedbacks = [],
  loading,
  counselorName = 'Counselor',
  onNavigateToStudents,
  onNavigateToStudent,
  onNavigateToFeedback,
}) {
  const totalStudents = students.length;

  const thisMonthFeedbacks = useMemo(() => {
    const now = new Date();
    return feedbacks.filter((f) => {
      const d = new Date(f.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [feedbacks]);

  const avgRating = useMemo(() => {
    const rated = feedbacks.filter((f) => f.rating);
    if (rated.length === 0) return 0;
    return Number((rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length).toFixed(1));
  }, [feedbacks]);

  const studentsNeedReview = useMemo(
    () =>
      students.filter(
        (s) => s.latestMatchScore != null && Number(s.latestMatchScore) < 60,
      ),
    [students],
  );

  const studentsWithoutGap = useMemo(
    () => students.filter((s) => s.latestMatchScore == null),
    [students],
  );

  const recentFeedbacks = feedbacks.slice(0, 5);
  const priorityList =
    studentsNeedReview.length > 0
      ? studentsNeedReview.slice(0, 6)
      : students.slice(0, 6);

  if (loading) {
    return (
      <section className="counselor-section counselor-section--tight">
        <div className="counselor-section-inner">
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section counselor-section--tight">
      <div className="counselor-section-inner">
        {/* Welcome Hero — Apple Editorial style */}
        <motion.header
          className="counselor-hero counselor-hero--left"
          style={{ marginBottom: 48 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <span className="counselor-eyebrow">Academic Counselor</span>
          <h1>Chào {counselorName.split(' ').slice(-1)[0]}, sẵn sàng hướng nghiệp?</h1>
          <p className="counselor-hero-lead">
            Phân tích hồ sơ, verify kỹ năng và lập lộ trình học tập tối ưu cùng sinh viên của bạn.
          </p>
        </motion.header>

        {/* KPI strip — first thing staff sees */}
        <div className="counselor-kpi-strip" style={{ marginTop: 0 }}>
          <motion.article 
            className="counselor-kpi-cell"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,102,204,0.015)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <span className="counselor-kpi-cell-label">Sinh viên</span>
            <span className="counselor-kpi-cell-value">
              <MotionNumber transition={{ type: 'spring', duration: 0.8 }}>{totalStudents}</MotionNumber>
            </span>
            <span className="counselor-kpi-cell-caption">
              Đang phân công
            </span>
          </motion.article>

          <motion.article 
            className="counselor-kpi-cell"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,102,204,0.015)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <span className="counselor-kpi-cell-label">Cần review</span>
            <span className="counselor-kpi-cell-value">
              <MotionNumber transition={{ type: 'spring', duration: 0.8 }}>{studentsNeedReview.length}</MotionNumber>
            </span>
            <span className="counselor-kpi-cell-caption">
              Match dưới 60%
            </span>
          </motion.article>

          <motion.article 
            className="counselor-kpi-cell"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,102,204,0.015)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <span className="counselor-kpi-cell-label">Chưa phân tích</span>
            <span className="counselor-kpi-cell-value">
              <MotionNumber transition={{ type: 'spring', duration: 0.8 }}>{studentsWithoutGap.length}</MotionNumber>
            </span>
            <span className="counselor-kpi-cell-caption">
              Chưa có skill gap
            </span>
          </motion.article>

          <motion.article 
            className="counselor-kpi-cell"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,102,204,0.015)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <span className="counselor-kpi-cell-label">Feedback tháng</span>
            <span className="counselor-kpi-cell-value">
              <MotionNumber transition={{ type: 'spring', duration: 0.8 }}>{thisMonthFeedbacks.length}</MotionNumber>
            </span>
            <span className="counselor-kpi-cell-caption">
              Trung bình {avgRating > 0 ? avgRating : '—'}/5 sao
            </span>
          </motion.article>
        </div>

        {/* Two-col: priority + recent feedback */}
        <div className="counselor-twocol" style={{ marginTop: 56 }}>
          <motion.article 
            className="counselor-panel"
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: 'rgba(0,102,204,0.1)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <header className="counselor-panel-head">
              <h3>
                {studentsNeedReview.length > 0 ? 'Cần review' : 'Sinh viên'}
              </h3>
              <Button
                type="button"
                variant="link"
                className="counselor-panel-link"
                onClick={onNavigateToStudents}
                hoverScale={1.02}
                tapScale={0.98}
              >
                Xem tất cả
              </Button>
            </header>
            {priorityList.length === 0 ? (
              <div className="counselor-empty">
                <div className="counselor-empty-icon" aria-hidden>◇</div>
                <h4>Chưa có sinh viên</h4>
                <p>Liên hệ admin để được phân công</p>
              </div>
            ) : (
              <div>
                <Fades holdDelay={50} inView={true}>
                  {priorityList.map((student) => {
                    const cls = getMatchScoreClass(student.latestMatchScore);
                    return (
                      <Button
                        key={student.id}
                        type="button"
                        variant="ghost"
                        className="counselor-listrow w-full text-left h-auto py-3 px-3"
                        onClick={() => onNavigateToStudent(student.id)}
                        hoverScale={1.01}
                        tapScale={0.99}
                      >
                        <div className="counselor-avatar" aria-hidden>
                          {getInitials(student.fullName)}
                        </div>
                        <div className="counselor-listrow-info">
                          <strong>{student.fullName}</strong>
                          <small>
                            {student.targetRoleName || 'Chưa chọn target role'}
                          </small>
                        </div>
                        <span className={`counselor-listrow-meta ${cls}`}>
                          {student.latestMatchScore != null
                            ? `${Math.round(Number(student.latestMatchScore))}%`
                            : '—'}
                        </span>
                      </Button>
                    );
                  })}
                </Fades>
              </div>
            )}
          </motion.article>

          <motion.article 
            className="counselor-panel"
            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: 'rgba(0,102,204,0.1)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <header className="counselor-panel-head">
              <h3>Feedback gần nhất</h3>
              <Button
                type="button"
                variant="link"
                className="counselor-panel-link"
                onClick={onNavigateToFeedback}
                hoverScale={1.02}
                tapScale={0.98}
              >
                Xem tất cả
              </Button>
            </header>
            {recentFeedbacks.length === 0 ? (
              <div className="counselor-empty">
                <div className="counselor-empty-icon" aria-hidden>◈</div>
                <h4>Chưa có feedback</h4>
                <p>Gửi feedback cho sinh viên để bắt đầu</p>
              </div>
            ) : (
              <div>
                <Fades holdDelay={50} inView={true}>
                  {recentFeedbacks.map((fb) => (
                    <div key={fb.id} className="counselor-feedback-row">
                      <div className="counselor-feedback-row-head">
                        <strong>{fb.studentFullName || 'Sinh viên'}</strong>
                        <time dateTime={fb.createdAt}>
                          {formatRelativeTime(fb.createdAt)}
                        </time>
                      </div>
                      {fb.rating > 0 && (
                        <div className="counselor-feedback-row-stars" aria-hidden>
                          {renderStars(fb.rating)}
                        </div>
                      )}
                      <p className="counselor-feedback-row-text">
                        {fb.feedbackText}
                      </p>
                    </div>
                  ))}
                </Fades>
              </div>
            )}
          </motion.article>
        </div>
      </div>
    </section>
  );
}
