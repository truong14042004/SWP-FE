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
  if (!date) return '—';
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
      ★
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
    return studentMap.get(studentId)?.fullName || fallback || 'Sinh viên';
  }

  const filteredFeedbacks = useMemo(() => {
    const q = filterStudent.trim().toLowerCase();
    if (!q) return feedbacks;
    return feedbacks.filter((fb) => {
      const name = getStudentName(fb.studentId, fb.studentFullName);
      return name.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbacks, filterStudent, studentMap]);

  if (feedbacks.length === 0) {
    return (
      <section className="counselor-section counselor-section--tight">
        <div className="counselor-section-inner">
          <div className="counselor-empty">
            <div className="counselor-empty-icon" aria-hidden>◈</div>
            <h3>Chưa có feedback</h3>
            <p>Gửi feedback đầu tiên cho sinh viên để bắt đầu.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section counselor-section--tight">
      <div className="counselor-section-inner counselor-section-inner--wide">
        <div className="counselor-toolbar">
          <div className="counselor-search">
            <span className="counselor-search-icon" aria-hidden>⌕</span>
            <input
              type="search"
              className="counselor-search-input"
              placeholder="Lọc theo tên sinh viên..."
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              aria-label="Tìm kiếm theo sinh viên"
            />
          </div>
        </div>

        <div className="counselor-feedback-table-wrap">
          <table className="counselor-feedback-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Sinh viên</th>
                <th>Rating</th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th aria-label="Hành động" />
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
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="text-truncate">{fb.feedbackText}</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="counselor-btn counselor-btn-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(fb.studentId);
                          }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="row-expanded">
                        <td colSpan={6}>
                          <div className="counselor-feedback-expanded">
                            <h5>Nội dung feedback</h5>
                            <p>{fb.feedbackText}</p>

                            {fb.recommendations && (
                              <>
                                <h5>Khuyến nghị</h5>
                                <p>{fb.recommendations}</p>
                              </>
                            )}

                            {fb.privateNotes && (
                              <div className="counselor-feedback-private">
                                <h5>Ghi chú riêng (chỉ bạn thấy)</h5>
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
