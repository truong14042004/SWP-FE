import { useMemo } from 'react';

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
    if (rated.length === 0) return '—';
    return (rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length).toFixed(1);
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
        {/* KPI strip — first thing staff sees */}
        <div className="counselor-kpi-strip" style={{ marginTop: 0 }}>
          <article className="counselor-kpi-cell">
            <span className="counselor-kpi-cell-label">Sinh viên</span>
            <span className="counselor-kpi-cell-value">{totalStudents}</span>
            <span className="counselor-kpi-cell-caption">
              Đang phân công
            </span>
          </article>

          <article className="counselor-kpi-cell">
            <span className="counselor-kpi-cell-label">Cần review</span>
            <span className="counselor-kpi-cell-value">
              {studentsNeedReview.length}
            </span>
            <span className="counselor-kpi-cell-caption">
              Match dưới 60%
            </span>
          </article>

          <article className="counselor-kpi-cell">
            <span className="counselor-kpi-cell-label">Chưa phân tích</span>
            <span className="counselor-kpi-cell-value">
              {studentsWithoutGap.length}
            </span>
            <span className="counselor-kpi-cell-caption">
              Chưa có skill gap
            </span>
          </article>

          <article className="counselor-kpi-cell">
            <span className="counselor-kpi-cell-label">Feedback tháng</span>
            <span className="counselor-kpi-cell-value">
              {thisMonthFeedbacks.length}
            </span>
            <span className="counselor-kpi-cell-caption">
              Trung bình {avgRating}/5 sao
            </span>
          </article>
        </div>

        {/* Two-col: priority + recent feedback */}
        <div className="counselor-twocol" style={{ marginTop: 56 }}>
          <article className="counselor-panel">
            <header className="counselor-panel-head">
              <h3>
                {studentsNeedReview.length > 0 ? 'Cần review' : 'Sinh viên'}
              </h3>
              <button
                type="button"
                className="counselor-panel-link"
                onClick={onNavigateToStudents}
              >
                Xem tất cả
              </button>
            </header>
            {priorityList.length === 0 ? (
              <div className="counselor-empty">
                <div className="counselor-empty-icon" aria-hidden>◇</div>
                <h4>Chưa có sinh viên</h4>
                <p>Liên hệ admin để được phân công</p>
              </div>
            ) : (
              <div>
                {priorityList.map((student) => {
                  const cls = getMatchScoreClass(student.latestMatchScore);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      className="counselor-listrow"
                      onClick={() => onNavigateToStudent(student.id)}
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
                    </button>
                  );
                })}
              </div>
            )}
          </article>

          <article className="counselor-panel">
            <header className="counselor-panel-head">
              <h3>Feedback gần nhất</h3>
              <button
                type="button"
                className="counselor-panel-link"
                onClick={onNavigateToFeedback}
              >
                Xem tất cả
              </button>
            </header>
            {recentFeedbacks.length === 0 ? (
              <div className="counselor-empty">
                <div className="counselor-empty-icon" aria-hidden>◈</div>
                <h4>Chưa có feedback</h4>
                <p>Gửi feedback cho sinh viên để bắt đầu</p>
              </div>
            ) : (
              <div>
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
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
