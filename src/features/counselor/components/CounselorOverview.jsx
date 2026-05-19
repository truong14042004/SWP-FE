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
  if (!date) return 'â€”';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return 'Vá»«a xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phĂºt trÆ°á»›c`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giá» trÆ°á»›c`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngĂ y trÆ°á»›c`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
}

function renderStars(rating = 0) {
  return Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`counselor-feedback-star ${i < (rating || 0) ? '' : 'empty'}`}
    >
      â˜…
    </span>
  ));
}

function formatGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'ChĂ o buá»•i sĂ¡ng';
  if (hour < 18) return 'ChĂ o buá»•i chiá»u';
  return 'ChĂ o buá»•i tá»‘i';
}

export function CounselorOverview({
  students = [],
  feedbacks = [],
  loading,
  counselorName = '',
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
    if (rated.length === 0) return 'â€”';
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
  const firstName = counselorName.split(' ').slice(-1)[0] || 'báº¡n';

  if (loading) {
    return (
      <section className="counselor-section">
        <div className="counselor-section-inner">
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Äang táº£i workspace...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Section 1 â€” Hero (canvas) */}
      <section className="counselor-section">
        <div className="counselor-section-inner">
          <div className="counselor-hero">
            <span className="counselor-hero-eyebrow">Counselor workspace</span>
            <h1>
              {formatGreeting()}, {firstName}.
            </h1>
            <p className="counselor-hero-lead">
              Äang theo dĂµi {totalStudents} sinh viĂªn Â·{' '}
              {thisMonthFeedbacks.length} feedback thĂ¡ng nĂ y.
              {studentsNeedReview.length > 0 &&
                ` ${studentsNeedReview.length} sinh viĂªn cáº§n Ä‘Æ°á»£c chĂº Ă½.`}
            </p>
          </div>

          {/* KPI Strip */}
          <div className="counselor-kpi-strip">
            <article className="counselor-kpi-cell">
              <span className="counselor-kpi-cell-label">Tá»•ng sinh viĂªn</span>
              <span className="counselor-kpi-cell-value">{totalStudents}</span>
              <span className="counselor-kpi-cell-caption">
                Äang Ä‘Æ°á»£c phĂ¢n cĂ´ng
              </span>
            </article>

            <article className="counselor-kpi-cell">
              <span className="counselor-kpi-cell-label">Cáº§n chĂº Ă½</span>
              <span className="counselor-kpi-cell-value">
                {studentsNeedReview.length}
              </span>
              <span className="counselor-kpi-cell-caption">
                {studentsWithoutGap.length > 0
                  ? `${studentsWithoutGap.length} chÆ°a phĂ¢n tĂ­ch Â· Match < 60%`
                  : 'Match score < 60%'}
              </span>
            </article>

            <article className="counselor-kpi-cell">
              <span className="counselor-kpi-cell-label">Feedback thĂ¡ng</span>
              <span className="counselor-kpi-cell-value">
                {thisMonthFeedbacks.length}
              </span>
              <span className="counselor-kpi-cell-caption">Pháº£n há»“i Ä‘Ă£ gá»­i</span>
            </article>

            <article className="counselor-kpi-cell">
              <span className="counselor-kpi-cell-label">ÄĂ¡nh giĂ¡ TB</span>
              <span className="counselor-kpi-cell-value">{avgRating}</span>
              <span className="counselor-kpi-cell-caption">
                TrĂªn thang 5 sao
              </span>
            </article>
          </div>
        </div>
      </section>

      {/* Section 2 â€” Two-col panels (parchment) */}
      <section className="counselor-section counselor-section--parchment">
        <div className="counselor-section-inner">
          <div className="counselor-twocol">
            {/* Need attention */}
            <article className="counselor-panel">
              <header className="counselor-panel-head">
                <h2>Sinh viĂªn cáº§n chĂº Ă½</h2>
                <button
                  type="button"
                  className="counselor-panel-link"
                  onClick={onNavigateToStudents}
                >
                  Xem táº¥t cáº£ â†’
                </button>
              </header>
              {students.length === 0 ? (
                <div className="counselor-empty-state">
                  <div className="counselor-empty-state-icon">đŸ‘¥</div>
                  <h3>ChÆ°a cĂ³ sinh viĂªn</h3>
                  <p>LiĂªn há»‡ admin Ä‘á»ƒ Ä‘Æ°á»£c phĂ¢n cĂ´ng sinh viĂªn</p>
                </div>
              ) : (
                <div>
                  {(studentsNeedReview.length > 0
                    ? studentsNeedReview.slice(0, 5)
                    : students.slice(0, 5)
                  ).map((student) => (
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
                          {student.targetRoleName || 'ChÆ°a chá»n target role'}
                        </small>
                      </div>
                      <span className="counselor-listrow-meta">
                        {student.latestMatchScore != null
                          ? `${Math.round(Number(student.latestMatchScore))}%`
                          : 'ChÆ°a phĂ¢n tĂ­ch'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </article>

            {/* Recent feedback */}
            <article className="counselor-panel">
              <header className="counselor-panel-head">
                <h2>Feedback gáº§n nháº¥t</h2>
                <button
                  type="button"
                  className="counselor-panel-link"
                  onClick={onNavigateToFeedback}
                >
                  Xem táº¥t cáº£ â†’
                </button>
              </header>
              {recentFeedbacks.length === 0 ? (
                <div className="counselor-empty-state">
                  <div className="counselor-empty-state-icon">đŸ’¬</div>
                  <h3>ChÆ°a cĂ³ feedback</h3>
                  <p>Gá»­i feedback cho sinh viĂªn Ä‘á»ƒ báº¯t Ä‘áº§u</p>
                </div>
              ) : (
                <div>
                  {recentFeedbacks.map((fb) => (
                    <div key={fb.id} className="counselor-feedback-row">
                      <div className="counselor-feedback-row-head">
                        <strong>{fb.studentFullName || 'Sinh viĂªn'}</strong>
                        <time dateTime={fb.createdAt}>
                          {formatRelativeTime(fb.createdAt)}
                        </time>
                      </div>
                      {fb.rating > 0 && (
                        <div
                          className="counselor-feedback-row-stars"
                          aria-hidden
                        >
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
    </>
  );
}
