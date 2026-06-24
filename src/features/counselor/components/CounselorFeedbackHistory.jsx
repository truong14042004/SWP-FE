import { Fragment, useMemo, useState } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Fade } from '@/components/animate-ui/primitives/effects/fade';
import { AnimatePresence, motion } from 'motion/react';

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

const GRADIENTS = [
  { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#d63384' },
  { bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', text: '#0066cc' },
  { bg: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', text: '#198754' },
  { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', text: '#fd7e14' },
  { bg: 'linear-gradient(135deg, #abecd6 0%, #fbed96 100%)', text: '#0f5132' },
  { bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', text: '#0aa2c0' },
  { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#6f42c1' },
  { bg: 'linear-gradient(135deg, #fddb92 0%, #d1f6f1 100%)', text: '#5c636a' },
];

function getStudentGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function renderStars(rating = 0) {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < (rating || 0);
    return (
      <svg
        key={i}
        className={`counselor-feedback-star ${filled ? 'filled' : 'empty'}`}
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: '15px',
          height: '15px',
          color: filled ? '#ffb800' : '#d2d2d7',
          display: 'inline-block',
          verticalAlign: 'middle',
          marginRight: '1px'
        }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  });
}

function getFeedbackTypeBadges(fb) {
  const hasRoadmap = !!fb.roadmapId;
  const hasSkillGap = !!fb.skillGapReportId;
  if (hasRoadmap && hasSkillGap) {
    return { label: 'Lộ trình + KN', title: 'Liên kết lộ trình và báo cáo khoảng cách kỹ năng' };
  }
  if (hasRoadmap) {
    return { label: 'Lộ trình', title: 'Liên kết lộ trình học tập' };
  }
  if (hasSkillGap) {
    return { label: 'Khoảng cách KN', title: 'Liên kết báo cáo khoảng cách kỹ năng' };
  }
  return null;
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
                <th>Đánh giá</th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th aria-label="Hành động" />
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((fb, index) => {
                const name = getStudentName(fb.studentId, fb.studentFullName);
                const isExpanded = expandedId === fb.id;
                const typeBadge = getFeedbackTypeBadges(fb);

                return (
                  <Fragment key={fb.id}>
                    <Fade asChild delay={index * 30} inView={true}>
                      <tr
                        className="row-clickable"
                        onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                      >
                        <td>{formatDate(fb.createdAt)}</td>
                        <td>
                          <div className="student-cell">
                            <div
                              className="student-avatar"
                              aria-hidden
                              style={{
                                background: getStudentGradient(name).bg,
                                color: getStudentGradient(name).text,
                                border: `1px solid ${getStudentGradient(name).text}25`
                              }}
                            >
                              {getInitials(name)}
                            </div>
                            <span style={{ fontWeight: 500 }}>{name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="counselor-feedback-stars" aria-hidden>
                            {renderStars(fb.rating)}
                          </span>
                        </td>
                        <td>
                          {typeBadge ? (
                            <span className="counselor-feedback-type-badge" title={typeBadge.title}>
                              {typeBadge.label}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div className="text-truncate">{fb.feedbackText}</div>
                        </td>
                        <td>
                          <Button
                            type="button"
                            variant="link"
                            className="counselor-btn counselor-btn-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent(fb.studentId);
                            }}
                            hoverScale={1.05}
                            tapScale={0.95}
                          >
                            Xem
                          </Button>
                        </td>
                      </tr>
                    </Fade>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.tr
                          key={`expanded-${fb.id}`}
                          className="row-expanded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <td colSpan={6} style={{ padding: 0 }}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="counselor-feedback-expanded" style={{ padding: '20px 24px' }}>
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
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
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
