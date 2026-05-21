import { useMemo, useState } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { Highlight } from '@/components/animate-ui/primitives/effects/highlight';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';

function SpotlightCard({ children, className = '', ...props }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.article
      className={`counselor-card relative overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0, 102, 204, 0.08)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              280px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 102, 204, 0.065),
              transparent 80%
            )
          `,
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          border: '1.5px solid transparent',
          background: useMotionTemplate`
            radial-gradient(
              180px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 102, 204, 0.22),
              transparent 80%
            )
          `,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskComposite: 'xor',
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.article>
  );
}

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
        // Filter dựa trên ngày được phân công cho counselor (assignedAt),
        // không phải ngày tạo tài khoản — sinh viên cũ được phân mới vẫn coi là 'mới'.
        const refDate = student.assignedAt || student.createdAt;
        if (!refDate) return false;
        const created = new Date(refDate);
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
          <div className="counselor-filters relative" role="tablist" style={{ display: 'inline-flex', padding: 2 }}>
            <Highlight
              value={filter}
              onValueChange={(val) => {
                if (val) setFilter(val);
              }}
              className="absolute inset-0 bg-[rgba(0,102,204,0.08)] rounded-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              hover={false}
              click={true}
            >
              {FILTERS.map((f) => {
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    data-value={f.id}
                    aria-selected={isActive}
                    className={`counselor-filter-chip relative z-10 ${isActive ? 'active' : ''}`}
                    style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </Highlight>
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
            <Fades holdDelay={40} inView={true}>
              {filteredStudents.map((student) => (
                <SpotlightCard key={student.id}>
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
                    <Button
                      type="button"
                      className="counselor-btn counselor-btn-secondary"
                      onClick={() => onOpenFeedbackModal(student)}
                      hoverScale={1.05}
                      tapScale={0.95}
                    >
                      Gửi feedback
                    </Button>
                    <Button
                      type="button"
                      className="counselor-btn counselor-btn-primary"
                      onClick={() => onSelectStudent(student.id)}
                      hoverScale={1.05}
                      tapScale={0.95}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </SpotlightCard>
              ))}
            </Fades>
          </div>
        )}
      </div>
    </section>
  );
}
