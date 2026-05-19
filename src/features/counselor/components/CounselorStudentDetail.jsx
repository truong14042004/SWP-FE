import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getStudentProfile,
  getStudentSkills,
  getStudentSkillGapLatest,
  getStudentSkillGapHistory,
  getStudentSkillGapById,
  getStudentRoadmap,
  getStudentFeedbacks,
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
  if (!date) return 'â€”';
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date) {
  if (!date) return 'â€”';
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
  if (s === 'completed') return 'âœ“';
  if (s === 'inprogress') return 'â†»';
  return 'â—‹';
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

const TABS = [
  { id: 'profile', label: 'Há»“ sÆ¡' },
  { id: 'skills', label: 'Ká»¹ nÄƒng' },
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
          toast.error(error.message || 'KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u sinh viĂªn');
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
      const cat = skill.skillCategory || 'KhĂ¡c';
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
      <section className="counselor-section">
        <div className="counselor-section-inner">
          <button
            type="button"
            className="counselor-detail-back"
            onClick={onBack}
          >
            â† Quay láº¡i danh sĂ¡ch
          </button>
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Äang táº£i dá»¯ liá»‡u sinh viĂªn...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="counselor-section">
      <div className="counselor-section-inner">
        <button
          type="button"
          className="counselor-detail-back"
          onClick={onBack}
        >
          â† Quay láº¡i danh sĂ¡ch
        </button>

        {/* Hero card (dark tile) */}
        <header className="counselor-hero-card">
          <div className="counselor-avatar counselor-avatar--xl" aria-hidden>
            {getInitials(student?.fullName)}
          </div>
          <div className="counselor-hero-card-info">
            <h2>{student?.fullName || 'Sinh viĂªn'}</h2>
            <p>{student?.email}</p>
            <div className="counselor-hero-card-tags">
              {profileDetails?.school && (
                <span className="counselor-tag">đŸ“ {profileDetails.school}</span>
              )}
              {profileDetails?.major && (
                <span className="counselor-tag">đŸ“ {profileDetails.major}</span>
              )}
              {profileDetails?.year && (
                <span className="counselor-tag">NÄƒm {profileDetails.year}</span>
              )}
              {profileDetails?.targetRoleName && (
                <span className="counselor-tag counselor-tag--accent">
                  đŸ¯ {profileDetails.targetRoleName}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="counselor-btn counselor-btn-primary counselor-btn-fixed"
            onClick={() => onOpenFeedbackModal(student)}
          >
            Viáº¿t feedback
          </button>
        </header>

        {/* Tabs */}
        <nav
          className="counselor-tabs"
          role="tablist"
          aria-label="Tabs chi tiáº¿t sinh viĂªn"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`counselor-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="counselor-tab-content" role="tabpanel">
          {activeTab === 'profile' && <ProfileTab profile={profileDetails} />}

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
                  toast.error(error.message || 'KhĂ´ng thá»ƒ táº£i chi tiáº¿t bĂ¡o cĂ¡o');
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
        </div>
      </div>
    </section>
  );
}

/* â”€â”€ Profile Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ProfileTab({ profile }) {
  if (!profile) {
    return (
      <div className="counselor-empty-state">
        <div className="counselor-empty-state-icon">đŸ“‹</div>
        <h3>ChÆ°a cĂ³ há»“ sÆ¡</h3>
        <p>Sinh viĂªn chÆ°a cáº­p nháº­t thĂ´ng tin há»“ sÆ¡</p>
      </div>
    );
  }

  return (
    <div className="counselor-profile-grid">
      <ProfileItem label="TrÆ°á»ng há»c" value={profile.school} />
      <ProfileItem label="ChuyĂªn ngĂ nh" value={profile.major} />
      <ProfileItem label="NÄƒm há»c" value={profile.year} />
      <ProfileItem label="GPA" value={profile.gpa} />
      <ProfileItem label="Má»¥c tiĂªu nghá» nghiá»‡p" value={profile.targetRoleName} />
      <ProfileItem
        label="Giá» há»c/tuáº§n"
        value={
          profile.preferredLearningHoursPerWeek != null
            ? `${profile.preferredLearningHoursPerWeek} giá»`
            : null
        }
      />
      {profile.careerGoal && (
        <ProfileItem
          label="Má»¥c tiĂªu nghá» nghiá»‡p chi tiáº¿t"
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
    </div>
  );
}

function ProfileItem({ label, value, fullWidth }) {
  return (
    <div className={`counselor-profile-item ${fullWidth ? 'full-width' : ''}`}>
      <span className="counselor-profile-label">{label}</span>
      <span className="counselor-profile-value">{value || 'â€”'}</span>
    </div>
  );
}

/* â”€â”€ Skills Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SkillsTab({ skills, skillsByCategory }) {
  if (skills.length === 0) {
    return (
      <div className="counselor-empty-state">
        <div className="counselor-empty-state-icon">đŸ’»</div>
        <h3>ChÆ°a cĂ³ ká»¹ nÄƒng</h3>
        <p>Sinh viĂªn chÆ°a khai bĂ¡o ká»¹ nÄƒng nĂ o</p>
      </div>
    );
  }

  const verifiedCount = skills.filter((s) => s.isVerified).length;

  return (
    <div>
      <p className="counselor-tab-meta">
        {skills.length} ká»¹ nÄƒng Â· {verifiedCount} Ä‘Ă£ verify Â·{' '}
        {skills.length - verifiedCount} chÆ°a verify
      </p>
      {Object.entries(skillsByCategory).map(([category, list]) => (
        <div key={category} className="counselor-skill-category">
          <header className="counselor-skill-category-head">
            <h4>{category}</h4>
            <span>{list.length} ká»¹ nÄƒng</span>
          </header>
          {list.map((skill) => (
            <div key={skill.id} className="counselor-skill-row">
              <div
                className={`counselor-skill-icon ${
                  skill.isVerified ? 'verified' : 'unverified'
                }`}
                aria-hidden
              >
                {skill.isVerified ? 'âœ“' : 'â '}
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
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* â”€â”€ Skill Gap Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SkillGapTab({ latest, history, selected, stats, loadingDetail, onSelect }) {
  if (!latest && history.length === 0) {
    return (
      <div className="counselor-empty-state">
        <div className="counselor-empty-state-icon">đŸ“</div>
        <h3>ChÆ°a cĂ³ bĂ¡o cĂ¡o Skill Gap</h3>
        <p>Sinh viĂªn chÆ°a cháº¡y phĂ¢n tĂ­ch skill gap</p>
      </div>
    );
  }

  const matchPercent = selected ? Math.round(Number(selected.matchScore)) : 0;
  const ringStyle = {
    background: `conic-gradient(var(--counselor-primary) 0deg, var(--counselor-primary) ${
      matchPercent * 3.6
    }deg, var(--counselor-divider-soft) ${matchPercent * 3.6}deg)`,
  };

  return (
    <div>
      {selected && (
        <>
          <div className="counselor-gap-overview">
            <div className="counselor-gap-ring-wrap">
              <div className="counselor-gap-ring" style={ringStyle}>
                <div className="counselor-gap-ring-inner">
                  <div>
                    <div className="counselor-gap-ring-value">{matchPercent}%</div>
                    <div className="counselor-gap-ring-label">Match score</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="counselor-gap-summary">
              <h3>{selected.careerRoleName}</h3>
              <p>{selected.summary || 'KhĂ´ng cĂ³ tá»•ng káº¿t.'}</p>
              {selected.items && (
                <div className="counselor-gap-stats">
                  <span className="counselor-gap-stat missing">
                    {stats.missing} thiáº¿u
                  </span>
                  <span className="counselor-gap-stat weak">
                    {stats.weak} yáº¿u
                  </span>
                  <span className="counselor-gap-stat achieved">
                    {stats.achieved} Ä‘áº¡t
                  </span>
                </div>
              )}
            </div>
          </div>

          {loadingDetail && (
            <div className="counselor-loading">
              <div className="counselor-spinner" aria-hidden />
              <p>Äang táº£i chi tiáº¿t bĂ¡o cĂ¡o...</p>
            </div>
          )}

          {!loadingDetail && selected.items?.length > 0 && (
            <>
              <h4 className="counselor-tab-section-title">
                Ká»¹ nÄƒng cáº§n Æ°u tiĂªn
              </h4>
              <div className="counselor-gap-list">
                {selected.items.map((item, index) => {
                  const cls = getGapStatusClass(item.status);
                  return (
                    <div
                      key={item.skillId}
                      className={`counselor-gap-item ${cls}`}
                    >
                      <div className="counselor-gap-item-priority">
                        #{index + 1}
                      </div>
                      <div className="counselor-gap-item-info">
                        <div className="counselor-gap-item-name">
                          {item.skillName}
                        </div>
                        <div className="counselor-gap-item-levels">
                          Hiá»‡n táº¡i: <strong>{item.currentLevel || 'â€”'}</strong>
                          {' â†’ '}YĂªu cáº§u: <strong>{item.requiredLevel}</strong>
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
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {history.length > 1 && (
        <div className="counselor-gap-history">
          <h4 className="counselor-tab-section-title">Lá»‹ch sá»­ bĂ¡o cĂ¡o</h4>
          {history.map((report) => (
            <button
              key={report.id}
              type="button"
              className={`counselor-gap-history-row ${
                selected?.id === report.id ? 'active' : ''
              }`}
              onClick={() => onSelect(report)}
            >
              <div className="counselor-gap-history-info">
                <strong>{formatShortDate(report.createdAt)}</strong>
                <span>
                  {Math.round(Number(report.matchScore))}% Â·{' '}
                  {report.careerRoleName}
                </span>
              </div>
              <span className="counselor-btn counselor-btn-text">Xem</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* â”€â”€ Roadmap Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function RoadmapTab({ roadmap, topLevelNodes, totalHours }) {
  if (!roadmap) {
    return (
      <div className="counselor-empty-state">
        <div className="counselor-empty-state-icon">đŸ§­</div>
        <h3>ChÆ°a cĂ³ Roadmap</h3>
        <p>Sinh viĂªn chÆ°a táº¡o lá»™ trĂ¬nh há»c táº­p</p>
      </div>
    );
  }

  const progress = Math.round(Number(roadmap.progress) || 0);

  return (
    <div>
      <header className="counselor-roadmap-head">
        <h3>{roadmap.title || 'Lá»™ trĂ¬nh há»c táº­p'}</h3>
        <p>
          Tráº¡ng thĂ¡i: {roadmap.status || 'Draft'} Â· {progress}% hoĂ n thĂ nh
          {totalHours > 0 ? ` Â· Dá»± kiáº¿n ${totalHours} giá»` : ''}
        </p>
      </header>

      <div className="counselor-roadmap-progress">
        <div className="counselor-roadmap-progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="counselor-roadmap-progress-text">
          <span>Tiáº¿n Ä‘á»™</span>
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
    <div className="counselor-roadmap-node">
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
    </div>
  );
}

/* â”€â”€ Feedback Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FeedbackTab({ feedbacks, onOpenFeedback }) {
  return (
    <div>
      <header className="counselor-feedback-tab-head">
        <h3>Feedback Ä‘Ă£ gá»­i ({feedbacks.length})</h3>
        <button
          type="button"
          className="counselor-btn counselor-btn-primary counselor-btn-fixed"
          onClick={onOpenFeedback}
        >
          + Má»›i
        </button>
      </header>

      {feedbacks.length === 0 ? (
        <div className="counselor-empty-state">
          <div className="counselor-empty-state-icon">đŸ’¬</div>
          <h3>ChÆ°a cĂ³ feedback</h3>
          <p>Gá»­i feedback Ä‘áº§u tiĂªn cho sinh viĂªn nĂ y</p>
        </div>
      ) : (
        <div className="counselor-feedback-list">
          {feedbacks.map((fb) => (
            <article key={fb.id} className="counselor-feedback-item">
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
                  <span className="counselor-feedback-type-badge">Tá»•ng quĂ¡t</span>
                )}
              </div>

              <p className="counselor-feedback-text">{fb.feedbackText}</p>

              {fb.recommendations && (
                <div className="counselor-feedback-section">
                  <div className="counselor-feedback-section-title">
                    Khuyáº¿n nghá»‹
                  </div>
                  <p>{fb.recommendations}</p>
                </div>
              )}

              {fb.privateNotes && (
                <div className="counselor-feedback-private">
                  <div className="counselor-feedback-section-title">
                    Ghi chĂº riĂªng (chá»‰ báº¡n tháº¥y)
                  </div>
                  <p>{fb.privateNotes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
