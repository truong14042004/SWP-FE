import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs';
import { ScrollProgress, ScrollProgressProvider } from '@/components/animate-ui/primitives/animate/scroll-progress';
import { Fade } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import {
  getStudentProfile,
  getStudentSkills,
  getStudentSkillGapLatest,
  getStudentSkillGapHistory,
  getStudentSkillGapById,
  getStudentRoadmap,
  getStudentFeedbacks,
  getSignedUrl,
} from '../api/counselorApi';

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
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function normalizeStatus(status = '') {
  return status.toLowerCase().replace(/[\s_]+/g, '');
}

function isAchievedStatus(status) {
  const s = normalizeStatus(status);
  return s === 'met' || s === 'achieved';
}

function isWeakStatus(status) {
  return normalizeStatus(status) === 'weak';
}

function getGapStatusClass(status) {
  if (isAchievedStatus(status)) return 'achieved';
  if (isWeakStatus(status)) return 'weak';
  return 'missing';
}

function getRoadmapStatusClass(status = '') {
  return normalizeStatus(status);
}

function getRoadmapStatusIcon(status = '') {
  const s = normalizeStatus(status);
  if (s === 'completed') return '✓';
  if (s === 'inprogress') return '↻';
  return '○';
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

const TABS = [
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'skillgap', label: 'Skill Gap' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'feedback', label: 'Feedback' },
];

export function CounselorStudentDetail({
  session,
  studentId,
  students = [],
  onBack,
  onOpenFeedbackModal,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillGapLatest, setSkillGapLatest] = useState(null);
  const [skillGapHistory, setSkillGapHistory] = useState([]);
  const [selectedSkillGapReport, setSelectedSkillGapReport] = useState(null);
  const [skillGapLoading, setSkillGapLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  const student = students.find((s) => s.id === studentId);
  const profileDetails = profile?.profile;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [p, sk, gapLatest, gapHistory, rm, fb] = await Promise.all([
          getStudentProfile(session, studentId).catch(() => null),
          getStudentSkills(session, studentId).catch(() => []),
          getStudentSkillGapLatest(session, studentId).catch(() => null),
          getStudentSkillGapHistory(session, studentId).catch(() => []),
          getStudentRoadmap(session, studentId).catch(() => null),
          getStudentFeedbacks(session, studentId).catch(() => []),
        ]);

        if (cancelled) return;

        setProfile(p);
        setSkills(Array.isArray(sk) ? sk : []);
        setSkillGapLatest(gapLatest);
        setSkillGapHistory(Array.isArray(gapHistory) ? gapHistory : []);
        setSelectedSkillGapReport(gapLatest);
        setRoadmap(rm);
        setFeedbacks(Array.isArray(fb) ? fb : []);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Không thể tải dữ liệu sinh viên');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session, studentId]);

  const skillsByCategory = useMemo(() => {
    return skills.reduce((acc, skill) => {
      const cat = skill.skillCategory || 'Khác';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});
  }, [skills]);

  const gapStats = useMemo(() => {
    const items = selectedSkillGapReport?.items || [];
    return {
      missing: items.filter(
        (i) => !isAchievedStatus(i.status) && !isWeakStatus(i.status),
      ).length,
      weak: items.filter((i) => isWeakStatus(i.status)).length,
      achieved: items.filter((i) => isAchievedStatus(i.status)).length,
    };
  }, [selectedSkillGapReport]);

  const roadmapTopLevelNodes = useMemo(() => {
    if (!roadmap) return [];
    if (Array.isArray(roadmap.nodeTree) && roadmap.nodeTree.length > 0) {
      return roadmap.nodeTree;
    }
    if (Array.isArray(roadmap.nodes)) {
      return roadmap.nodes.filter((n) => !n.parentNodeId);
    }
    return [];
  }, [roadmap]);

  const roadmapTotalHours = useMemo(() => {
    if (!roadmap?.nodes) return 0;
    return roadmap.nodes
      .filter((n) => n.nodeType !== 'Group')
      .reduce((sum, n) => sum + (n.estimatedHours || 0), 0);
  }, [roadmap]);

  if (loading) {
    return (
      <section className="counselor-section counselor-section--tight">
        <div className="counselor-section-inner counselor-section-inner--wide">
          <Button
            type="button"
            className="counselor-back-btn"
            onClick={onBack}
            hoverScale={1.05}
            tapScale={0.95}
          >
            Quay lại
          </Button>
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Đang tải...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ScrollProgressProvider global={true} direction="horizontal">
      <ScrollProgress
        className="fixed top-0 left-0 right-0 h-1 z-50 transform origin-left"
        mode="scaleX"
        style={{ backgroundColor: 'var(--c-primary, #0f766e)' }}
      />

      {/* Full-bleed dark hero */}
      <section className="counselor-detail-hero">
        <div className="counselor-detail-hero-inner">
          <div className="counselor-avatar counselor-avatar--xl" aria-hidden>
            {getInitials(student?.fullName)}
          </div>
          <div className="counselor-detail-hero-info">
            <span className="counselor-eyebrow">Sinh viên</span>
            <h1>{student?.fullName || 'Sinh viên'}</h1>
            <p>{student?.email}</p>
            <div className="counselor-tags">
              {profileDetails?.school && (
                <span className="counselor-tag">{profileDetails.school}</span>
              )}
              {profileDetails?.major && (
                <span className="counselor-tag">{profileDetails.major}</span>
              )}
              {profileDetails?.year && (
                <span className="counselor-tag">Năm {profileDetails.year}</span>
              )}
              {profileDetails?.targetRoleName && (
                <span className="counselor-tag counselor-tag--accent">
                  {profileDetails.targetRoleName}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <Button
              type="button"
              className="counselor-btn counselor-btn-on-dark counselor-btn-lg"
              onClick={() => onOpenFeedbackModal(student)}
              hoverScale={1.05}
              tapScale={0.95}
            >
              Viết feedback
            </Button>
            <Button
              type="button"
              className="counselor-btn counselor-btn-link on-dark"
              onClick={onBack}
              hoverScale={1.05}
              tapScale={0.95}
            >
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky tabs navigation wrap */}
      <div className="counselor-tabs-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-[600px] mx-auto">
          <TabsList className="w-full bg-[#f4f1ea] dark:bg-[#252422] p-1 rounded-xl flex gap-1 border dark:border-neutral-800">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="py-2 text-sm font-medium transition-all"
              >
                {t.label}
                {t.id === 'skills' && skills.length > 0 && ` (${skills.length})`}
                {t.id === 'feedback' && feedbacks.length > 0 && ` (${feedbacks.length})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <section className="counselor-section counselor-section--tight">
        <div className="counselor-section-inner counselor-section-inner--wide">
          <div className="counselor-tab-content" role="tabpanel">
            <Fade key={activeTab} inView={true} delay={100} transition={{ duration: 0.3 }}>
              {activeTab === 'profile' && <ProfileTab profile={profileDetails} session={session} />}

              {activeTab === 'skills' && (
                <SkillsTab skills={skills} skillsByCategory={skillsByCategory} />
              )}

              {activeTab === 'skillgap' && (
                <SkillGapTab
                  latest={skillGapLatest}
                  history={skillGapHistory}
                  selected={selectedSkillGapReport}
                  stats={gapStats}
                  loadingDetail={skillGapLoading}
                  onSelect={async (report) => {
                    if (skillGapLatest && report.id === skillGapLatest.id) {
                      setSelectedSkillGapReport(skillGapLatest);
                      return;
                    }
                    setSkillGapLoading(true);
                    try {
                      const full = await getStudentSkillGapById(
                        session,
                        studentId,
                        report.id,
                      );
                      setSelectedSkillGapReport(full);
                    } catch (error) {
                      toast.error(error.message || 'Không thể tải chi tiết báo cáo');
                      setSelectedSkillGapReport(report);
                    } finally {
                      setSkillGapLoading(false);
                    }
                  }}
                />
              )}

              {activeTab === 'roadmap' && (
                <RoadmapTab
                  roadmap={roadmap}
                  topLevelNodes={roadmapTopLevelNodes}
                  totalHours={roadmapTotalHours}
                />
              )}

              {activeTab === 'feedback' && (
                <FeedbackTab
                  feedbacks={feedbacks}
                  onOpenFeedback={() => onOpenFeedbackModal(student)}
                />
              )}
            </Fade>
          </div>
        </div>
      </section>
    </ScrollProgressProvider>
  );
}

/* ── Profile Tab ─────────────────────────────────────────── */
function ProfileTab({ profile, session }) {
  if (!profile) {
    return (
      <div className="counselor-empty">
        <div className="counselor-empty-icon" aria-hidden>◇</div>
        <h4>Chưa có hồ sơ</h4>
        <p>Sinh viên chưa cập nhật thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="counselor-profile-grid">
      <ProfileItem label="Trường học" value={profile.school} />
      <ProfileItem label="Chuyên ngành" value={profile.major} />
      <ProfileItem label="Năm học" value={profile.year} />
      <ProfileItem label="GPA" value={profile.gpa} />
      <ProfileItem label="Mục tiêu nghề nghiệp" value={profile.targetRoleName} />
      <ProfileItem
        label="Giờ học/tuần"
        value={
          profile.preferredLearningHoursPerWeek != null
            ? `${profile.preferredLearningHoursPerWeek} giờ`
            : null
        }
      />
      {profile.careerGoal && (
        <ProfileItem
          label="Mục tiêu nghề nghiệp chi tiết"
          value={profile.careerGoal}
          fullWidth
        />
      )}
      {profile.githubUsername && (
        <ProfileItem
          label="GitHub"
          fullWidth
          value={
            <a
              href={`https://github.com/${profile.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{profile.githubUsername}
            </a>
          }
        />
      )}
      {profile.cvUrl && (
        <ProfileItem
          label="CV"
          fullWidth
          value={
            <button
              type="button"
              className="underline text-teal-700 hover:text-teal-600 font-medium text-left"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--c-primary, #0f766e)' }}
              onClick={async () => {
                try {
                  const response = await getSignedUrl(session, profile.cvUrl);
                  if (response.url) {
                    window.open(response.url, '_blank');
                  }
                } catch (error) {
                  toast.error('Không thể tải CV.');
                }
              }}
            >
              📄 {profile.cvName || 'Xem CV'}
            </button>
          }
        />
      )}
    </div>
  );
}

function ProfileItem({ label, value, fullWidth }) {
  return (
    <div className={`counselor-profile-item ${fullWidth ? 'full-width' : ''}`}>
      <span className="counselor-profile-label">{label}</span>
      <span className="counselor-profile-value">{value || '—'}</span>
    </div>
  );
}

/* ── Skills Tab ──────────────────────────────────────────── */
function SkillsTab({ skills, skillsByCategory }) {
  if (skills.length === 0) {
    return (
      <div className="counselor-empty">
        <div className="counselor-empty-icon" aria-hidden>◌</div>
        <h4>Chưa có kỹ năng</h4>
        <p>Sinh viên chưa khai báo kỹ năng nào</p>
      </div>
    );
  }

  const verifiedCount = skills.filter((s) => s.isVerified).length;

  return (
    <div>
      <p className="counselor-tab-meta">
        {skills.length} kỹ năng · {verifiedCount} đã verify ·{' '}
        {skills.length - verifiedCount} chưa verify
      </p>
      {Object.entries(skillsByCategory).map(([category, list]) => (
        <div key={category} className="counselor-skill-category">
          <header className="counselor-skill-category-head">
            <h4>{category}</h4>
            <span>{list.length} kỹ năng</span>
          </header>
          {list.map((skill) => (
            <motion.div
              key={skill.id}
              className="counselor-skill-row"
              whileHover={{ x: 6, backgroundColor: 'rgba(0,102,204,0.015)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <div
                className={`counselor-skill-icon ${
                  skill.isVerified ? 'verified' : 'unverified'
                }`}
                aria-hidden
              >
                {skill.isVerified ? '✓' : '○'}
              </div>
              <span className="counselor-skill-name">{skill.skillName}</span>
              <span
                className={`counselor-skill-level ${
                  skill.level?.toLowerCase() || 'beginner'
                }`}
              >
                {skill.level}
              </span>
              {skill.verifiedByFullName && (
                <span className="counselor-skill-verifier">
                  Verify: {skill.verifiedByFullName}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Skill Gap Tab ───────────────────────────────────────── */
function SkillGapTab({ latest, history, selected, stats, loadingDetail, onSelect }) {
  if (!latest && history.length === 0) {
    return (
      <div className="counselor-empty">
        <div className="counselor-empty-icon" aria-hidden>◇</div>
        <h4>Chưa có báo cáo Skill Gap</h4>
        <p>Sinh viên chưa chạy phân tích skill gap</p>
      </div>
    );
  }

  const matchPercent = selected ? Math.round(Number(selected.matchScore)) : 0;
  const ringStyle = {
    background: `conic-gradient(var(--c-primary) 0deg, var(--c-primary) ${
      matchPercent * 3.6
    }deg, var(--c-divider-soft) ${matchPercent * 3.6}deg)`,
  };

  return (
    <div>
      {selected && (
        <>
          <div className="counselor-gap-overview">
            <div className="counselor-gap-ring" style={ringStyle}>
              <div className="counselor-gap-ring-inner">
                <div>
                  <div className="counselor-gap-ring-value">{matchPercent}%</div>
                  <div className="counselor-gap-ring-label">Match</div>
                </div>
              </div>
            </div>
            <div className="counselor-gap-summary">
              <h3>{selected.careerRoleName}</h3>
              <p>{selected.summary || 'Không có tổng kết.'}</p>
              {selected.items && (
                <div className="counselor-gap-stats">
                  <span className="counselor-gap-stat missing">
                    {stats.missing} thiếu
                  </span>
                  <span className="counselor-gap-stat weak">
                    {stats.weak} yếu
                  </span>
                  <span className="counselor-gap-stat achieved">
                    {stats.achieved} đạt
                  </span>
                </div>
              )}
            </div>
          </div>

          {loadingDetail && (
            <div className="counselor-loading">
              <div className="counselor-spinner" aria-hidden />
              <p>Đang tải chi tiết báo cáo...</p>
            </div>
          )}

          {!loadingDetail && selected.items?.length > 0 && (
            <>
              <h4 className="counselor-tab-section-title">
                Kỹ năng cần ưu tiên
              </h4>
              <div className="counselor-gap-list">
                {selected.items.map((item, index) => {
                  const cls = getGapStatusClass(item.status);
                  return (
                    <motion.div
                      key={item.skillId}
                      className={`counselor-gap-item ${cls}`}
                      whileHover={{ x: 6 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    >
                      <div className="counselor-gap-item-priority">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="counselor-gap-item-name">
                          {item.skillName}
                        </div>
                        <div className="counselor-gap-item-levels">
                          Hiện tại: <strong>{item.currentLevel || '—'}</strong>
                          {' → '}Yêu cầu: <strong>{item.requiredLevel}</strong>
                        </div>
                        {item.recommendation && (
                          <div className="counselor-gap-item-recommendation">
                            {item.recommendation}
                          </div>
                        )}
                      </div>
                      <span className={`counselor-gap-status ${cls}`}>
                        {item.status}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {history.length > 1 && (
        <div className="counselor-gap-history">
          <h4 className="counselor-tab-section-title">Lịch sử báo cáo</h4>
          {history.map((report) => (
            <Button
              key={report.id}
              asChild
              hoverScale={1.02}
              tapScale={0.98}
            >
              <button
                type="button"
                className={`counselor-gap-history-row ${
                  selected?.id === report.id ? 'active' : ''
                }`}
                style={{
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onClick={() => onSelect(report)}
              >
                <div className="counselor-gap-history-info">
                  <strong>{formatShortDate(report.createdAt)}</strong>
                  <span>
                    {Math.round(Number(report.matchScore))}% ·{' '}
                    {report.careerRoleName}
                  </span>
                </div>
                <span className="counselor-btn counselor-btn-link">Xem</span>
              </button>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Roadmap Tab ─────────────────────────────────────────── */
function RoadmapTab({ roadmap, topLevelNodes, totalHours }) {
  if (!roadmap) {
    return (
      <div className="counselor-empty">
        <div className="counselor-empty-icon" aria-hidden>◇</div>
        <h4>Chưa có Roadmap</h4>
        <p>Sinh viên chưa tạo lộ trình học tập</p>
      </div>
    );
  }

  const progress = Math.round(Number(roadmap.progress) || 0);

  return (
    <div>
      <header className="counselor-roadmap-head">
        <h3>{roadmap.title || 'Lộ trình học tập'}</h3>
        <p>
          Trạng thái: {roadmap.status || 'Draft'} · {progress}% hoàn thành
          {totalHours > 0 ? ` · Dự kiến ${totalHours} giờ` : ''}
        </p>
      </header>

      <div className="counselor-roadmap-progress">
        <div className="counselor-roadmap-progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="counselor-roadmap-progress-text">
          <span>Tiến độ</span>
          <span>{progress}%</span>
        </div>
      </div>

      {topLevelNodes.map((node) => (
        <RoadmapNode key={node.id} node={node} />
      ))}
    </div>
  );
}

function RoadmapNode({ node }) {
  const isGroup =
    node.nodeType === 'Group' ||
    (node.children && node.children.length > 0);

  if (isGroup) {
    return (
      <section className="counselor-roadmap-group">
        <header className="counselor-roadmap-group-head">
          <h4>{node.title}</h4>
        </header>
        {(node.children || []).map((child) => (
          <RoadmapNode key={child.id} node={child} />
        ))}
      </section>
    );
  }

  const statusClass = getRoadmapStatusClass(node.status);
  return (
    <motion.div
      className="counselor-roadmap-node"
      whileHover={{ x: 6, backgroundColor: 'rgba(0,102,204,0.015)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <div
        className={`counselor-roadmap-node-status ${statusClass}`}
        aria-hidden
      >
        {getRoadmapStatusIcon(node.status)}
      </div>
      <div className="counselor-roadmap-node-info">
        <h5>{node.title}</h5>
        {node.description && <p>{node.description}</p>}
      </div>
      <span className={`counselor-roadmap-node-badge ${statusClass}`}>
        {node.status}
      </span>
    </motion.div>
  );
}

/* ── Feedback Tab ────────────────────────────────────────── */
function FeedbackTab({ feedbacks, onOpenFeedback }) {
  return (
    <div>
      <header className="counselor-feedback-tab-head">
        <h3>Feedback đã gửi ({feedbacks.length})</h3>
        <Button
          type="button"
          className="counselor-btn counselor-btn-primary"
          onClick={onOpenFeedback}
          hoverScale={1.05}
          tapScale={0.95}
        >
          + Mới
        </Button>
      </header>

      {feedbacks.length === 0 ? (
        <div className="counselor-empty">
          <div className="counselor-empty-icon" aria-hidden>◈</div>
          <h4>Chưa có feedback</h4>
          <p>Gửi feedback đầu tiên cho sinh viên này</p>
        </div>
      ) : (
        <div className="counselor-feedback-list">
          {feedbacks.map((fb) => (
            <motion.article
              key={fb.id}
              className="counselor-feedback-item"
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0, 102, 204, 0.05)', borderColor: 'rgba(0, 102, 204, 0.15)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <header className="counselor-feedback-header">
                <span className="counselor-feedback-date">
                  {formatDate(fb.createdAt)}
                </span>
                <div className="counselor-feedback-stars" aria-hidden>
                  {renderStars(fb.rating)}
                </div>
              </header>

              <div className="counselor-feedback-type">
                {fb.roadmapId && (
                  <span className="counselor-feedback-type-badge">Roadmap</span>
                )}
                {fb.skillGapReportId && (
                  <span className="counselor-feedback-type-badge">
                    Skill Gap
                  </span>
                )}
                {!fb.roadmapId && !fb.skillGapReportId && (
                  <span className="counselor-feedback-type-badge">Tổng quát</span>
                )}
              </div>

              <p className="counselor-feedback-text">{fb.feedbackText}</p>

              {fb.recommendations && (
                <div className="counselor-feedback-section">
                  <div className="counselor-feedback-section-title">
                    Khuyến nghị
                  </div>
                  <p>{fb.recommendations}</p>
                </div>
              )}

              {fb.privateNotes && (
                <div className="counselor-feedback-private">
                  <div className="counselor-feedback-section-title">
                    Ghi chú riêng (chỉ bạn thấy)
                  </div>
                  <p>{fb.privateNotes}</p>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
