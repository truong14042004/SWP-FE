import { useMemo, useState } from 'react';

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
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
}

function getMatchScoreClass(score) {
  if (score == null) return 'muted';
  const n = Number(score);
  if (n >= 75) return 'strong';
  if (n >= 60) return 'medium';
  return 'weak';
}

function formatMatchScore(score) {
  if (score == null) return 'Chưa phân tích';
  return `${Math.round(Number(score))}%`;
}

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'review', label: 'Cần review' },
  { id: 'no-gap', label: 'Chưa phân tích' },
  { id: 'new', label: 'Mới' },
];

export function CounselorStudentList({
  students = [],
  loading,
  onSelectStudent,
  onOpenFeedbackModal,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !q ||
        student.fullName?.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filter === 'new') {
        const created = new Date(student.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }
      if (filter === 'review') {
        const score = student.latestMatchScore;
        return score != null && Number(score) < 60;
      }
      if (filter === 'no-gap') {
        return student.latestMatchScore == null;
      }
      return true;
    });
  }, [students, searchQuery, filter]);

  if (loading) {
    return (
      <section className="counselor-section counselor-section--tight">
        <div className="counselor-section-inner">
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Đang tải...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section counselor-section--tight">
      <div className="counselor-section-inner counselor-section-inner--wide">
        {/* Toolbar */}
        <div className="counselor-toolbar">
          <div className="counselor-search">
            <span className="counselor-search-icon" aria-hidden>⌕</span>
            <input
              type="search"
              className="counselor-search-input"
              placeholder="Tìm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm sinh viên"
            />
          </div>
          <div className="counselor-filters" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`counselor-filter-chip ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredStudents.length === 0 ? (
          <div className="counselor-empty">
            <div className="counselor-empty-icon" aria-hidden>◇</div>
            <h3>Không tìm thấy sinh viên</h3>
            <p>
              {searchQuery
                ? 'Thử thay đổi từ khóa hoặc bộ lọc'
                : 'Chưa được phân công sinh viên nào'}
            </p>
          </div>
        ) : (
          <div className="counselor-grid">
            {filteredStudents.map((student) => (
              <article key={student.id} className="counselor-card">
                <header className="counselor-card-head">
                  <div className="counselor-avatar counselor-avatar--lg" aria-hidden>
                    {getInitials(student.fullName)}
                  </div>
                  <div className="counselor-card-info">
                    <h3>{student.fullName}</h3>
                    <span>{student.email}</span>
                  </div>
                </header>

                <dl className="counselor-card-meta">
                  <div className="counselor-card-meta-row">
                    <span>Career goal</span>
                    <strong>{student.targetRoleName || 'Chưa chọn'}</strong>
                  </div>
                  <div className="counselor-card-meta-row">
                    <span>Match</span>
                    <strong
                      className={`counselor-score-pill counselor-score-pill--${getMatchScoreClass(
                        student.latestMatchScore,
                      )}`}
                    >
                      {formatMatchScore(student.latestMatchScore)}
                    </strong>
                  </div>
                  <div className="counselor-card-meta-row">
                    <span>Cập nhật</span>
                    <strong>
                      {student.latestSkillGapAt
                        ? formatRelativeTime(student.latestSkillGapAt)
                        : '—'}
                    </strong>
                  </div>
                </dl>

                <div className="counselor-card-actions">
                  <button
                    type="button"
                    className="counselor-btn counselor-btn-link no-arrow"
                    onClick={() => onOpenFeedbackModal(student)}
                  >
                    Feedback
                  </button>
                  <button
                    type="button"
                    className="counselor-btn counselor-btn-link"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    Chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
