import { Fragment, useMemo, useState } from 'react';

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

function formatDate(date) {
  if (!date) return 'â€”';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function getFeedbackTypeBadges(fb) {
  const types = [];
  if (fb.roadmapId) types.push('R');
  if (fb.skillGapReportId) types.push('SG');
  if (types.length === 0) return null;
  return types.join('+');
}

export function CounselorFeedbackHistory({
  feedbacks = [],
  students = [],
  onSelectStudent,
}) {
  const [filterStudent, setFilterStudent] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  function getStudentName(studentId, fallback) {
    return studentMap.get(studentId)?.fullName || fallback || 'Sinh viĂªn';
  }

  const filteredFeedbacks = useMemo(() => {
    const q = filterStudent.trim().toLowerCase();
    if (!q) return feedbacks;
    return feedbacks.filter((fb) => {
      const name = getStudentName(fb.studentId, fb.studentFullName);
      return name.toLowerCase().includes(q);
    });
  }, [feedbacks, filterStudent, studentMap]);

  if (feedbacks.length === 0) {
    return (
      <section className="counselor-section">
        <div className="counselor-section-inner">
          <div className="counselor-hero" style={{ marginBottom: 32 }}>
            <span className="counselor-hero-eyebrow">Lá»‹ch sá»­ feedback</span>
            <h1>ChÆ°a cĂ³ feedback nĂ o</h1>
            <p className="counselor-hero-lead">
              Gá»­i feedback Ä‘áº§u tiĂªn cho sinh viĂªn Ä‘á»ƒ báº¯t Ä‘áº§u xĂ¢y dá»±ng kho pháº£n há»“i.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section">
      <div className="counselor-section-inner">
        <div className="counselor-hero" style={{ marginBottom: 32 }}>
          <span className="counselor-hero-eyebrow">Lá»‹ch sá»­ feedback</span>
          <h1>{feedbacks.length} pháº£n há»“i Ä‘Ă£ gá»­i</h1>
          <p className="counselor-hero-lead">
            Xem láº¡i cĂ¡c feedback báº¡n Ä‘Ă£ gá»­i cho sinh viĂªn, kĂ¨m liĂªn káº¿t Roadmap vĂ  Skill Gap.
          </p>
        </div>

        <div className="counselor-toolbar">
          <div className="counselor-search">
            <span className="counselor-search-icon" aria-hidden>
              đŸ”
            </span>
            <input
              type="search"
              className="counselor-search-input"
              placeholder="Lá»c theo tĂªn sinh viĂªn..."
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              aria-label="TĂ¬m kiáº¿m theo sinh viĂªn"
            />
          </div>
        </div>

        <div className="counselor-feedback-table-wrap">
          <table className="counselor-feedback-table">
            <thead>
              <tr>
                <th>NgĂ y</th>
                <th>Sinh viĂªn</th>
                <th>Rating</th>
                <th>Loáº¡i</th>
                <th>Ná»™i dung</th>
                <th aria-label="HĂ nh Ä‘á»™ng" />
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((fb) => {
                const name = getStudentName(fb.studentId, fb.studentFullName);
                const isExpanded = expandedId === fb.id;
                const typeBadge = getFeedbackTypeBadges(fb);

                return (
                  <Fragment key={fb.id}>
                    <tr
                      className="row-clickable"
                      onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                    >
                      <td>{formatDate(fb.createdAt)}</td>
                      <td>
                        <div className="student-cell">
                          <div className="student-avatar" aria-hidden>
                            {getInitials(name)}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="counselor-feedback-stars" aria-hidden>
                          {renderStars(fb.rating)}
                        </span>
                      </td>
                      <td>
                        {typeBadge ? (
                          <span className="counselor-feedback-type-badge">
                            {typeBadge}
                          </span>
                        ) : (
                          'â€”'
                        )}
                      </td>
                      <td>
                        <div className="text-truncate">{fb.feedbackText}</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="counselor-btn counselor-btn-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(fb.studentId);
                          }}
                        >
                          Xem SV
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="row-expanded">
                        <td colSpan={6}>
                          <div className="counselor-feedback-expanded">
                            <h5>Ná»™i dung feedback</h5>
                            <p>{fb.feedbackText}</p>

                            {fb.recommendations && (
                              <>
                                <h5>Khuyáº¿n nghá»‹</h5>
                                <p>{fb.recommendations}</p>
                              </>
                            )}

                            {fb.privateNotes && (
                              <div className="counselor-feedback-private">
                                <div className="counselor-feedback-section-title">
                                  Ghi chĂº riĂªng (chá»‰ báº¡n tháº¥y)
                                </div>
                                <p>{fb.privateNotes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
