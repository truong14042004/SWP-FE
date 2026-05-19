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
  if (!date) return 'â€”';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Vá»«a xong';
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
  if (score == null) return 'ChÆ°a phĂ¢n tĂ­ch';
  return `${Math.round(Number(score))}%`;
}

const FILTERS = [
  { id: 'all', label: 'Táº¥t cáº£' },
  { id: 'review', label: 'Cáº§n review', title: 'Match score < 60%' },
  { id: 'no-gap', label: 'ChÆ°a phĂ¢n tĂ­ch', title: 'ChÆ°a cháº¡y phĂ¢n tĂ­ch skill gap' },
  { id: 'new', label: 'Má»›i', title: 'PhĂ¢n cĂ´ng trong 7 ngĂ y' },
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
      <section className="counselor-section">
        <div className="counselor-section-inner">
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Äang táº£i danh sĂ¡ch sinh viĂªn...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section">
      <div className="counselor-section-inner">
        {/* Header */}
        <div className="counselor-hero" style={{ marginBottom: 32 }}>
          <span className="counselor-hero-eyebrow">Sinh viĂªn cá»§a tĂ´i</span>
          <h1>{students.length} sinh viĂªn</h1>
          <p className="counselor-hero-lead">
            Theo dĂµi target role, match score vĂ  lĂªn lá»‹ch feedback cho tá»«ng sinh viĂªn.
          </p>
        </div>

        {/* Toolbar */}
        <div className="counselor-toolbar">
          <div className="counselor-search">
            <span className="counselor-search-icon" aria-hidden>
              đŸ”
            </span>
            <input
              type="search"
              className="counselor-search-input"
              placeholder="TĂ¬m theo tĂªn hoáº·c email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="TĂ¬m kiáº¿m sinh viĂªn"
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
                title={f.title}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredStudents.length === 0 ? (
          <div className="counselor-empty-state">
            <div className="counselor-empty-state-icon">đŸ‘¥</div>
            <h3>KhĂ´ng tĂ¬m tháº¥y sinh viĂªn</h3>
            <p>
              {searchQuery
                ? 'Thá»­ thay Ä‘á»•i tá»« khĂ³a tĂ¬m kiáº¿m hoáº·c bá»™ lá»c'
                : 'Báº¡n chÆ°a Ä‘Æ°á»£c phĂ¢n cĂ´ng sinh viĂªn nĂ o, vui lĂ²ng liĂªn há»‡ admin'}
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
                    <strong>{student.targetRoleName || 'ChÆ°a chá»n'}</strong>
                  </div>
                  <div className="counselor-card-meta-row">
                    <span>Match score</span>
                    <strong
                      className={`counselor-score-pill counselor-score-pill--${getMatchScoreClass(
                        student.latestMatchScore,
                      )}`}
                    >
                      {formatMatchScore(student.latestMatchScore)}
                    </strong>
                  </div>
                  <div className="counselor-card-meta-row">
                    <span>Cáº­p nháº­t gap</span>
                    <strong>
                      {student.latestSkillGapAt
                        ? formatRelativeTime(student.latestSkillGapAt)
                        : 'â€”'}
                    </strong>
                  </div>
                </dl>

                <div className="counselor-card-actions">
                  <button
                    type="button"
                    className="counselor-btn counselor-btn-secondary"
                    onClick={() => onOpenFeedbackModal(student)}
                  >
                    Feedback
                  </button>
                  <button
                    type="button"
                    className="counselor-btn counselor-btn-primary"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    Xem chi tiáº¿t
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
