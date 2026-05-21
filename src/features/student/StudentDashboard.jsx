import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { apiUrl } from '../../config';
import '../../styles.css';
import '../../styles/admin.css';
import '../../styles/student.css';
import { StudentProfileForm } from './components/StudentProfileForm';
import '../../styles/student-dashboard.css';
import {
  createStudentProfile,
  getCareerRoles,
  getStudentProfile,
  importStudentAvatarFromUrl,
  updateStudentProfile,
  uploadStudentAvatar,
} from './studentApi';
import { StudentPortfolioPage } from './components/StudentPortfolioPage';
import { StudentRoadmapPage } from './components/StudentRoadmapPage';
import { StudentSkillsPage } from './components/StudentSkillsPage';
import { StudentGithubPage } from './components/StudentGithubPage';
import { StudentMentorPage } from './components/StudentMentorPage';
import { StudentSubscriptionPage } from './components/StudentSubscriptionPage';
import { StudentFeedbacksPage } from './components/StudentFeedbacksPage';
import { NotificationBell } from '../notifications/NotificationBell';
import { getGithubRepositories } from './githubApi';
import { getMentorSessions } from './mentorApi';
import { getRoadmapById, getRoadmaps } from './roadmapApi';
import { getLatestSkillGap, getUserSkills } from './skillsApi';
const STUDENT_SECTIONS = [
  { id: 'overview', label: 'Bảng điều khiển' },
  { id: 'roadmap', label: 'Lộ trình nghề nghiệp' },
  { id: 'skills', label: 'Kỹ năng & Phân tích' },
  { id: 'github', label: 'Tích hợp GitHub' },
  { id: 'portfolio', label: 'Xây dựng Portfolio' },
  { id: 'mentors', label:'AI tư vấn'},
  { id: 'feedbacks', label: 'Feedback nhận được' },
  { id: 'settings', label: 'Cài đặt' },
];

const SECTION_META = {
  overview: {
    eyebrow: 'Student dashboard',
    title: 'Tổng quan tiến độ học tập',
    subtitle: 'Theo dõi mức độ sẵn sàng, kỹ năng còn thiếu và các việc cần ưu tiên cho vai trò',
  },
  roadmap: {
    eyebrow: 'Career roadmap',
    title: 'Lộ trình nghề nghiệp cá nhân',
    subtitle: 'Các mốc học tập được sắp xếp theo thứ tự ưu tiên cho vai trò',
  },
  skills: {
    eyebrow: 'Skill gap analysis',
    title: 'Kỹ năng và khóa học đề xuất',
    subtitle: 'Tập trung vào nhóm kỹ năng còn thiếu hoặc cần cải thiện cho vai trò',
  },
  mentors: {
    eyebrow: 'Mentor sessions',
    title: 'Lịch hẹn tư vấn sắp tới',
    subtitle: 'Chuẩn bị trước nội dung cần hỏi mentor để rút ngắn thời gian đạt mục tiêu',
  },
  community: {
    eyebrow: 'Mentor community',
    title: 'Cộng đồng mentor và hoạt động mới',
    subtitle: 'Cập nhật thảo luận, tài nguyên và lời khuyên liên quan đến vai trò',
  },
};

const emptyProfile = {
  school: '',
  major: '',
  year: '',
  gpa: '',
  avatarUrl: '',
  targetRoleId: '',
  githubUsername: '',
  careerGoal: '',
  preferredLearningHoursPerWeek: '',
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function renderStars(count) {
  return Array.from({ length: count }, (_, index) => <span key={index}>★</span>);
}

function normalizeProfile(profile) {
  if (!profile) return emptyProfile;
  return {
    school: profile.school || '',
    major: profile.major || '',
    year: profile.year ?? '',
    gpa: profile.gpa ?? '',
    avatarUrl: profile.avatarUrl || '',
    targetRoleId: profile.targetRoleId || '',
    githubUsername: profile.githubUsername || '',
    careerGoal: profile.careerGoal || '',
    preferredLearningHoursPerWeek: profile.preferredLearningHoursPerWeek ?? '',
  };
}

function profilePayload(form) {
  return {
    school: form.school.trim(),
    major: form.major.trim(),
    year: Number(form.year),
    gpa: Number(form.gpa),
    avatarUrl: form.avatarUrl.trim() || null,
    targetRoleId: form.targetRoleId,
    githubUsername: form.githubUsername.trim() || null,
    careerGoal: form.careerGoal.trim(),
    preferredLearningHoursPerWeek: Number(form.preferredLearningHoursPerWeek),
  };
}

function getRoleId(role) {
  return role?.id ?? role?.roleId ?? role?.careerRoleId ?? role?.value;
}

function getRoleName(role) {
  return role?.name || role?.title || role?.roleName || role?.label;
}

function resolveAvatarSrc(avatarUrl, userId) {
  if (!avatarUrl) {
    return '';
  }

  const normalizedAvatarUrl = avatarUrl.trim();

  if (/^https?:\/\//i.test(normalizedAvatarUrl)) {
    return normalizedAvatarUrl;
  }

  if (!apiUrl) {
    return '';
  }

  if (normalizedAvatarUrl.startsWith('/api/storage/public/')) {
    return `${apiUrl}${normalizedAvatarUrl}`;
  }

  if (normalizedAvatarUrl.startsWith('api/storage/public/')) {
    return `${apiUrl}/${normalizedAvatarUrl}`;
  }

  const objectPath = normalizedAvatarUrl.replace(/^\/+/, '');
  const avatarFolderMatch = objectPath.match(/^(users\/[^/]+\/avatar)(?:\/.*)?$/i);

  if (avatarFolderMatch) {
    return `${apiUrl}/api/storage/public/${avatarFolderMatch[1]}/download`;
  }

  if (userId) {
    return `${apiUrl}/api/storage/public/users/${userId}/avatar/download`;
  }

  return `${apiUrl}/api/storage/public/${objectPath}/download`;
}

const DEFAULT_DASHBOARD_OVERVIEW = {
  metrics: [
    { label: 'Match score', value: '0%', caption: 'Chưa có báo cáo skill gap', tone: 'primary' },
    { label: 'Kỹ năng của tôi', value: '0', caption: 'Chưa thêm kỹ năng', tone: 'success' },
    { label: 'Tiến độ roadmap', value: '0%', caption: 'Chưa có lộ trình', tone: 'warning' },
    { label: 'GitHub repos', value: '0', caption: 'Chưa đồng bộ GitHub', tone: 'info' },
  ],
  score: 0,
  scoreStats: {
    done: 0,
    weak: 0,
    missing: 0,
  },
  roadmapSteps: [],
  skillGroups: {
    missing: [],
    weak: [],
    done: [],
  },
  learningQueue: [],
  mentorSessions: [],
  communityItems: [],
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampPercent(value) {
  const number = Math.round(Number(value) || 0);

  if (number < 0) return 0;
  if (number > 100) return 100;
  return number;
}

function formatDashboardDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_');
}

function isCompletedStatus(status) {
  const normalized = normalizeStatus(status);
  return ['completed', 'verified', 'done', 'hoàn_thành', 'da_hoan_thanh'].includes(normalized);
}

function getLevelScore(level) {
  const normalized = String(level || '').trim().toLowerCase();

  if (normalized.includes('advanced') || normalized.includes('expert')) return 100;
  if (normalized.includes('intermediate')) return 50;
  if (normalized.includes('beginner')) return 25;

  const number = Number(level);
  return Number.isFinite(number) ? clampPercent(number) : 0;
}

function getSkillGapItems(report) {
  if (!report) return [];

  const possibleLists = [
    report.gaps,
    report.skillGaps,
    report.items,
    report.details,
    report.missingSkills,
    report.skillGapDetails,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function getReportScore(report) {
  const score =
    report?.matchScore ??
    report?.score ??
    report?.overallScore ??
    report?.readinessScore ??
    report?.progress ??
    0;

  return clampPercent(score);
}

function sortLatest(items) {
  return safeArray(items).slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || a.startTime || a.scheduledAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || b.startTime || b.scheduledAt || 0).getTime();

    return dateB - dateA;
  });
}

function getChildren(node) {
  return safeArray(node?.children).filter((child) => typeof child === 'object');
}

function getRoadmapNodes(roadmap) {
  const tree = safeArray(roadmap?.nodeTree);
  if (tree.length > 0) return tree;

  return safeArray(roadmap?.nodes)
    .slice()
    .sort((a, b) => {
      const levelA = Number(a.level || 0);
      const levelB = Number(b.level || 0);
      const orderA = Number(a.orderIndex || 0);
      const orderB = Number(b.orderIndex || 0);

      if (levelA !== levelB) return levelA - levelB;
      return orderA - orderB;
    });
}

function flattenRoadmapNodes(nodes) {
  return safeArray(nodes).flatMap((node) => [
    node,
    ...flattenRoadmapNodes(getChildren(node)),
  ]);
}

function isProgressNode(node) {
  return normalizeStatus(node?.nodeType) !== 'group';
}

function calculateRoadmapProgress(nodes) {
  const flatNodes = flattenRoadmapNodes(nodes).filter(isProgressNode);

  if (!flatNodes.length) return 0;

  const completed = flatNodes.filter((node) => isCompletedStatus(node.status)).length;

  return Math.round((completed / flatNodes.length) * 100);
}

function getRoadmapStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (['completed', 'verified', 'done'].includes(normalized)) return 'Đã hoàn thành';
  if (['inprogress', 'in_progress', 'progressing', 'active'].includes(normalized)) return 'Đang học';
  if (['needreview', 'need_review'].includes(normalized)) return 'Cần review';

  return status || 'Chưa bắt đầu';
}

function mapRoadmapStep(node, index) {
  const resources = [node?.learningResource, ...safeArray(node?.learningResources)].filter(Boolean);
  const resource = resources[0];
  const progress = isCompletedStatus(node?.status) ? 100 : clampPercent(node?.progress);

  return {
    title: node?.title || node?.name || resource?.title || `Giai đoạn ${index + 1}`,
    detail:
      node?.description ||
      node?.note ||
      resource?.description ||
      resource?.url ||
      'Chưa có mô tả chi tiết.',
    status: getRoadmapStatusLabel(node?.status),
    progress,
  };
}

function mapGapToSkillCard(item) {
  return {
    name: item?.skillName || item?.name || item?.title || 'Kỹ năng chưa xác định',
    current: item?.currentLevel || item?.userLevel || item?.level || 'N/A',
    target: item?.requiredLevel || item?.targetLevel || item?.expectedLevel || 'N/A',
    action: item?.recommendation ? 'Xem gợi ý' : 'Học ngay',
    progress: 0,
  };
}

function mapUserSkillToCard(item, gapByName) {
  const score = getLevelScore(item?.level);
  const isAchieved = item?.isVerified || score >= 50;
  const skillName = item?.skillName || item?.name;
  const matchingGap = skillName ? gapByName?.get(skillName.trim().toLowerCase()) : null;
  const requiredLevel =
    matchingGap?.requiredLevel ||
    matchingGap?.targetLevel ||
    matchingGap?.expectedLevel ||
    null;

  let target;
  if (requiredLevel) {
    target = requiredLevel;
  } else if (item?.isVerified) {
    target = 'Đã verified';
  } else if (isAchieved) {
    target = 'Chờ verify';
  } else {
    target = 'Cần cải thiện';
  }

  return {
    name: skillName || 'Kỹ năng chưa xác định',
    current: item?.level || 'N/A',
    target,
    action: isAchieved ? 'Đạt yêu cầu' : 'Cải thiện',
    progress: score,
  };
}

function buildDashboardOverview({
  roadmap,
  roadmaps,
  userSkills,
  skillGap,
  repositories,
  mentorSessions,
}) {
  const skills = safeArray(userSkills);
  const repos = safeArray(repositories);
  const mentors = safeArray(mentorSessions);
  const gapItems = getSkillGapItems(skillGap);

  const averageSkillScore = skills.length
    ? Math.round(skills.reduce((sum, item) => sum + getLevelScore(item.level), 0) / skills.length)
    : 0;

  const matchScore = getReportScore(skillGap) || averageSkillScore;

  // Phân loại sẽ tính trong skillGroups bên dưới.

  const roadmapNodes = getRoadmapNodes(roadmap);
  const roadmapProgress = calculateRoadmapProgress(roadmapNodes);
  const roadmapSteps = roadmapNodes.slice(0, 4).map(mapRoadmapStep);

  // Index gap items by skill name (lowercased) so we can look them up when rendering user-skills.
  const gapByName = new Map();
  for (const item of gapItems) {
    const key = (item?.skillName || item?.name || item?.title || '').trim().toLowerCase();
    if (key) gapByName.set(key, item);
  }

  // Skills that are achieved (verified OR ≥ Intermediate) — match the 'Đã đạt' label.
  const achievedSkills = skills.filter((item) => item.isVerified || getLevelScore(item.level) >= 50);

  // Skills that are 'còn yếu' = has some level (>0) but below Intermediate (50)
  // AND is NOT already listed in the skill-gap report as 'thiếu' (avoid duplication).
  const weakSkills = skills.filter((item) => {
    const score = getLevelScore(item.level);
    if (score === 0 || score >= 50) return false;
    const key = (item.skillName || item.name || '').trim().toLowerCase();
    return !gapByName.has(key);
  });

  const skillGroups = {
    missing: gapItems.slice(0, 5).map(mapGapToSkillCard),
    weak: weakSkills.slice(0, 5).map((item) => mapUserSkillToCard(item, gapByName)),
    done: achievedSkills.slice(0, 5).map((item) => mapUserSkillToCard(item, gapByName)),
  };

  const learningQueue = gapItems.slice(0, 3).map((item) => ({
    title: item.skillName || item.name || item.title || 'Kỹ năng cần bổ sung',
    duration: item.estimatedHours ? `${item.estimatedHours} giờ` : 'Cần bổ sung',
    level: item.priority || item.level || 'Ưu tiên',
  }));

  const mappedMentorSessions = sortLatest(mentors).slice(0, 3).map((item) => ({
    mentor:
      item.mentorName ||
      item.mentor?.fullName ||
      item.mentor?.name ||
      item.mentor ||
      'AI Mentor',
    topic: item.topic || item.title || item.subject || item.question || 'Phiên tư vấn',
    time: formatDashboardDate(item.startTime || item.scheduledAt || item.createdAt),
  }));

  const communityItems = repos.slice(0, 3).map((repo) => ({
    title: repo.repoName || repo.name || repo.fullName || 'Repository GitHub',
    meta: repo.mainLanguage || repo.language || repo.defaultBranch || 'GitHub',
  }));

  return {
    metrics: [
      {
        label: 'Match score',
        value: `${matchScore}%`,
        caption: skillGap ? 'Từ báo cáo skill gap mới nhất' : 'Tính từ kỹ năng hiện tại',
        tone: 'primary',
      },
      {
        label: 'Kỹ năng của tôi',
        value: `${skills.length}`,
        caption: `${achievedSkills.length} kỹ năng đạt yêu cầu`,
        tone: 'success',
      },
      {
        label: 'Tiến độ roadmap',
        value: `${roadmapProgress}%`,
        caption: roadmaps?.length ? `${roadmaps.length} lộ trình đã tạo` : 'Chưa có lộ trình',
        tone: 'warning',
      },
      {
        label: 'GitHub repos',
        value: `${repos.length}`,
        caption: repos.length ? 'Repository đã đồng bộ' : 'Chưa đồng bộ GitHub',
        tone: 'info',
      },
    ],
    score: matchScore,
    scoreStats: {
      done: achievedSkills.length,
      weak: weakSkills.length,
      missing: gapItems.length,
    },
    roadmapSteps,
    skillGroups,
    learningQueue,
    mentorSessions: mappedMentorSessions,
    communityItems,
  };
}


export function StudentDashboard({ session, onSignOut, onNavigateHome }) {
  function getInitialStudentSection() {
  const hashSection = window.location.hash.replace('#', '');

  return STUDENT_SECTIONS.some((section) => section.id === hashSection)
    ? hashSection
    : 'overview';
}

const [activeSection, setActiveSection] = useState(getInitialStudentSection);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState(emptyProfile);
  const [careerRoles, setCareerRoles] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarImportDraft, setAvatarImportDraft] = useState('');
  const [dashboardOverview, setDashboardOverview] = useState(DEFAULT_DASHBOARD_OVERVIEW);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const initials = getInitials(session?.user?.fullName);
  const firstName = session?.user?.fullName?.split(' ')?.slice(-1)?.[0] || 'bạn';
  const sectionMeta = SECTION_META[activeSection] || SECTION_META.overview;
  const avatarSrc = useMemo(
    () => resolveAvatarSrc(session?.user?.avatarUrl || form.avatarUrl, session?.user?.id),
    [form.avatarUrl, session?.user?.avatarUrl, session?.user?.id],
  );

  useEffect(() => {
    loadProfile();
    loadDashboardOverview();
  }, []);

  const visibleGroups = useMemo(() => {
    if (activeTab === 'missing') return ['missing'];
    if (activeTab === 'weak') return ['weak'];
    if (activeTab === 'done') return ['done'];
    return ['missing', 'weak', 'done'];
  }, [activeTab]);

  const skillTabs = useMemo(() => {
    const groups = dashboardOverview.skillGroups || DEFAULT_DASHBOARD_OVERVIEW.skillGroups;
    const missingCount = safeArray(groups.missing).length;
    const weakCount = safeArray(groups.weak).length;
    const doneCount = safeArray(groups.done).length;
    const total = missingCount + weakCount + doneCount;

    return [
      { id: 'all', label: `Tất cả kỹ năng (${total})` },
      { id: 'missing', label: `Thiếu (${missingCount})` },
      { id: 'weak', label: `Còn yếu (${weakCount})` },
      { id: 'done', label: `Đã đạt (${doneCount})` },
    ];
  }, [dashboardOverview.skillGroups]);

  const targetRoleName = useMemo(() => {
    const selectedRole = careerRoles.find((role) => String(getRoleId(role)) === String(form.targetRoleId));
    return getRoleName(selectedRole) || 'mục tiêu chưa thiết lập';
  }, [careerRoles, form.targetRoleId]);

  async function loadDashboardOverview() {
    setLoadingOverview(true);

    try {
      const [roadmapListResult, userSkillResult, latestGapResult, repoResult, mentorSessionResult] =
        await Promise.all([
          getRoadmaps(session).catch(() => []),
          getUserSkills(session).catch(() => []),
          getLatestSkillGap(session).catch(() => null),
          getGithubRepositories(session).catch(() => []),
          getMentorSessions(session).catch(() => []),
        ]);

      const sortedRoadmaps = sortLatest(roadmapListResult);
      const latestRoadmapSummary = sortedRoadmaps[0];

      const latestRoadmap = latestRoadmapSummary?.id
        ? await getRoadmapById(session, latestRoadmapSummary.id).catch(() => latestRoadmapSummary)
        : null;

      const overview = buildDashboardOverview({
        roadmap: latestRoadmap,
        roadmaps: sortedRoadmaps,
        userSkills: userSkillResult,
        skillGap: latestGapResult,
        repositories: repoResult,
        mentorSessions: mentorSessionResult,
      });

      setDashboardOverview(overview);
    } catch (requestError) {
      toast.error(requestError.message || 'Không tải được dữ liệu bảng điều khiển.');
    } finally {
      setLoadingOverview(false);
    }
  }

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const [roles, profileResult] = await Promise.all([
        getCareerRoles().catch(() => []),
        getStudentProfile(session)
          .then((profile) => ({ profile, hasProfile: true }))
          .catch((requestError) => {
            if (requestError?.status === 404) {
              return { profile: null, hasProfile: false };
            }
            throw requestError;
          }),
      ]);

      setCareerRoles(Array.isArray(roles) ? roles.filter((role) => role.isActive !== false) : []);
      setForm(normalizeProfile(profileResult.profile));
      setHasProfile(profileResult.hasProfile);
    } catch (requestError) {
      toast.error(requestError.message || 'Khong tai duoc ho so sinh vien.');
    } finally {
      setLoadingProfile(false);
    }
  }

  function updateField(event) {
    const { name, value, type, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadStudentAvatar(session, file);
      const nextAvatarUrl = uploaded?.downloadPath || uploaded?.objectName || '';
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      toast.success('Da upload avatar.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong upload duoc avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarImport() {
    const avatarUrl = avatarImportDraft.trim();
    if (!avatarUrl) {
      toast.error('Vui long nhap URL avatar.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileName = avatarUrl.split('/').pop()?.split('?')[0] || 'avatar';
      const imported = await importStudentAvatarFromUrl(session, { url: avatarUrl, fileName });
      const nextAvatarUrl = imported?.downloadPath || imported?.objectName || avatarUrl;
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      setAvatarImportDraft('');
      toast.success('Da import avatar tu URL.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong import duoc avatar tu URL.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = profilePayload(form);
      const saved = hasProfile
        ? await updateStudentProfile(session, payload)
        : await createStudentProfile(session, payload);

      setForm(normalizeProfile(saved));
      setHasProfile(true);
      toast.success(hasProfile ? 'Da cap nhat ho so.' : 'Da tao ho so.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong luu duoc ho so.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="admin-shell student-shell">
      <aside className="admin-sidebar student-sidebar">
        <div className="student-brand">
          <span className="student-brand-mark">SWP</span>
          <div>
            <strong>Career Compass</strong>
            <span>Chào mừng {firstName} quay trở lại</span>
          </div>
        </div>

        <nav className="admin-nav student-nav" aria-label="Student sections">
          {STUDENT_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                setActiveSection(section.id);
                window.history.replaceState({}, '', `#${section.id}`);
              }}
            >
              <span className="student-nav-dot" />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="student-sidebar-footer">
          <button
            type="button"
            className="student-upgrade-btn"
            onClick={() => setActiveSection('subscription')}
          >
            Nâng cấp tài khoản
          </button>
          <div className="admin-account">
            <div className="admin-account-info">
              {avatarSrc ? (
                <img className="admin-account-avatar" src={avatarSrc} alt="Student avatar" />
              ) : (
                <span className="admin-account-avatar">{initials}</span>
              )}
              <div>
                <strong>{session?.user?.fullName}</strong>
                <small>{session?.user?.email}</small>
              </div>
            </div>
            <button type="button" onClick={onSignOut}>Đăng xuất</button>
          </div>
        </div>
      </aside>

      <section className="admin-main student-main">
      {!['portfolio', 'roadmap','skills','github','mentors','subscription','feedbacks'].includes(activeSection) && (
  <header className="student-header-bar">
    <button type="button" className="student-search-bar" onClick={() => setActiveSection('skills')}>
      <span>⌕</span>
      Tìm kiếm khóa học, mentor, kỹ năng...
    </button>

    <div className="student-header-actions">
      <NotificationBell
        session={session}
        onNavigate={(target) => {
          // Map BE link target to student section id
          if (target === 'roadmap') setActiveSection('roadmap');
          else if (target === 'skills') setActiveSection('skills');
          else if (target === 'portfolio') setActiveSection('portfolio');
          else setActiveSection('overview');
        }}
      />
      <button type="button" className="student-avatar-chip" onClick={() => setActiveSection('settings')}>
        {avatarSrc ? <img src={avatarSrc} alt="Student avatar" /> : initials}
      </button>
    </div>
  </header>
)}

     {activeSection === 'portfolio' ? (
  <StudentPortfolioPage session={session} />
) : activeSection === 'roadmap' ? (
  <StudentRoadmapPage session={session} />
) : activeSection === 'skills' ? (
  <StudentSkillsPage session={session} />
) : activeSection === 'github' ? (
  <StudentGithubPage session={session} />
) : activeSection === 'mentors' ? (
  <StudentMentorPage session={session} />
) : activeSection === 'subscription' ? (
  <StudentSubscriptionPage session={session} />
) : activeSection === 'feedbacks' ? (
  <StudentFeedbacksPage session={session} />
) : activeSection === 'settings' ? (
          <section className="student-profile-page">
            <div className="student-profile-heading">
              <button type="button" className="student-back-link" onClick={() => setActiveSection('overview')}>← Quay lại dashboard</button>
              <h1>Quản lý hồ sơ</h1>
              <p>Cập nhật thông tin học vấn và mục tiêu nghề nghiệp của bạn.</p>
            </div>

            <StudentProfileForm
              initials={initials}
              avatarSrc={avatarSrc}
              form={form}
              avatarImportDraft={avatarImportDraft}
              onAvatarImportDraftChange={(value) => setAvatarImportDraft(value)}
              careerRoles={careerRoles}
              loadingProfile={loadingProfile}
              savingProfile={savingProfile}
              uploadingAvatar={uploadingAvatar}
              hasProfile={hasProfile}
              onChange={updateField}
              onAvatarFileChange={handleAvatarFileChange}
              onAvatarImport={handleAvatarImport}
              onReload={loadProfile}
              onSubmit={handleSaveProfile}
            />
          </section>
        ) : (
          <>
            <header className="student-topbar">
              <div className="student-topbar-copy">
                <button type="button" className="student-back-link" onClick={onNavigateHome}>← Quay lại trang chủ</button>
                <span className="student-eyebrow">{sectionMeta.eyebrow}</span>
                <h1>{sectionMeta.title}</h1>
                <p>{sectionMeta.subtitle} <strong>{targetRoleName}</strong>.</p>
              </div>
              <div className="student-topbar-actions">
                <button type="button" className="student-secondary-btn" onClick={() => setActiveSection('settings')}>Cập nhật hồ sơ</button>
                <button type="button" className="student-cta-btn" onClick={() => setActiveSection('roadmap')}>Tạo lộ trình cá nhân hóa</button>
              </div>
            </header>

            {loadingOverview && (
              <p className="student-overview-loading">Đang tải dữ liệu bảng điều khiển...</p>
            )}

            <section className="student-overview-grid" aria-label="Student metrics">
              {dashboardOverview.metrics.map((metric) => (
                <article key={metric.label} className={`student-metric-card ${metric.tone}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.caption}</small>
                </article>
              ))}
            </section>

            <section className="student-dashboard-layout">
              <article className="student-score-card">
                <div className="student-panel-heading">
                  <span>Readiness</span>
                  <h2>Độ phù hợp</h2>
                  <p>Mức độ sẵn sàng hiện tại cho vai trò {targetRoleName}</p>
                </div>

                <div className="student-score-ring">
                  <div className="student-score-ring-inner">
                    <strong>{dashboardOverview.score}%</strong>
                    <span>Match score</span>
                  </div>
                </div>

                <div className="student-score-stats">
                  <div>
                    <strong>{dashboardOverview.scoreStats.done}</strong>
                    <span>Đã đạt</span>
                  </div>
                  <div>
                    <strong>{dashboardOverview.scoreStats.weak}</strong>
                    <span>Còn yếu</span>
                  </div>
                  <div>
                    <strong>{dashboardOverview.scoreStats.missing}</strong>
                    <span>Thiếu</span>
                  </div>
                </div>
              </article>

              <article className="student-roadmap-card">
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Roadmap</span>
                    <h2>Lộ trình 4 giai đoạn</h2>
                  </div>
                  <button type="button" onClick={() => setActiveSection('roadmap')}>Xem chi tiết</button>
                </div>

                <div className="student-roadmap-list">
                  {dashboardOverview.roadmapSteps.length === 0 && (
                    <div className="student-compact-item static">
                      <div>
                        <strong>Chưa có lộ trình</strong>
                        <small>Vào trang Lộ trình nghề nghiệp để tạo roadmap mới.</small>
                      </div>
                      <span>0%</span>
                    </div>
                  )}

                  {dashboardOverview.roadmapSteps.map((step, index) => (
                    <div key={step.title} className="student-roadmap-step">
                      <span className="student-roadmap-index">{index + 1}</span>
                      <div>
                        <div className="student-roadmap-step-head">
                          <strong>{step.title}</strong>
                          <small>{step.status}</small>
                        </div>
                        <p>{step.detail}</p>
                        <div className="student-progress slim">
                          <span style={{ width: `${step.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="student-content-grid">
              <article className="student-gap-panel">
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Skill gap</span>
                    <h2>Kỹ năng cần tập trung</h2>
                  </div>
                </div>

                <div className="student-skill-tabs">
                  {skillTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {visibleGroups.includes('missing') && (
                  <div className="student-group">
                    <h3 className="student-group-title danger">Kỹ năng đang thiếu</h3>
                    {dashboardOverview.skillGroups.missing.length === 0 && (
                      <p className="student-empty-note">Chưa có kỹ năng thiếu từ báo cáo skill gap.</p>
                    )}
                    {dashboardOverview.skillGroups.missing.map((skill) => (
                      <div key={skill.name} className="student-skill-card missing">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                            <span className="student-stars">{renderStars(3)}</span>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSection('skills')}
                          aria-label={`${skill.action} kỹ năng ${skill.name}`}
                        >
                          {skill.action}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {visibleGroups.includes('weak') && (
                  <div className="student-group">
                    <h3 className="student-group-title warning">Kỹ năng cần cải thiện</h3>
                    {dashboardOverview.skillGroups.weak.length === 0 && (
                      <p className="student-empty-note">Chưa có kỹ năng yếu cần cải thiện.</p>
                    )}
                    {dashboardOverview.skillGroups.weak.map((skill) => (
                      <div key={skill.name} className="student-skill-card weak">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                            <span className="student-stars">{renderStars(3)}</span>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                          <div className="student-progress">
                            <span style={{ width: `${skill.progress}%` }} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSection('skills')}
                          aria-label={`${skill.action} kỹ năng ${skill.name}`}
                        >
                          {skill.action}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {visibleGroups.includes('done') && (
                  <div className="student-group">
                    <h3 className="student-group-title success">Kỹ năng đã đạt</h3>
                    {dashboardOverview.skillGroups.done.length === 0 && (
                      <p className="student-empty-note">Chưa có kỹ năng đã đạt hoặc đã xác minh.</p>
                    )}
                    {dashboardOverview.skillGroups.done.map((skill) => (
                      <div key={skill.name} className="student-skill-card done">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSection('skills')}
                          aria-label={`${skill.action} kỹ năng ${skill.name}`}
                        >
                          {skill.action}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <aside className="student-right-rail">
                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>Learning queue</span>
                    <h2>Khóa học ưu tiên</h2>
                  </div>
                  <div className="student-compact-list">
                    {dashboardOverview.learningQueue.length === 0 && (
                      <div className="student-compact-item static">
                        <div>
                          <strong>Chưa có khóa học ưu tiên</strong>
                          <small>Phân tích skill gap để hệ thống gợi ý.</small>
                        </div>
                        <span>—</span>
                      </div>
                    )}
                    {dashboardOverview.learningQueue.map((item) => (
                      <button key={item.title} type="button" className="student-compact-item">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.duration}</small>
                        </div>
                        <span>{item.level}</span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>Mentor</span>
                    <h2>Lịch tư vấn</h2>
                  </div>
                  <div className="student-compact-list">
                    {dashboardOverview.mentorSessions.length === 0 && (
                      <div className="student-compact-item static">
                        <div>
                          <strong>Chưa có lịch tư vấn</strong>
                          <small>Vào AI tư vấn để bắt đầu phiên mới.</small>
                        </div>
                        <span>—</span>
                      </div>
                    )}
                    {dashboardOverview.mentorSessions.map((sessionItem) => (
                      <div key={sessionItem.topic} className="student-compact-item static">
                        <div>
                          <strong>{sessionItem.topic}</strong>
                          <small>{sessionItem.mentor}</small>
                        </div>
                        <span>{sessionItem.time}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>GitHub</span>
                    <h2>Repository mới</h2>
                  </div>
                  <div className="student-compact-list">
                    {dashboardOverview.communityItems.length === 0 && (
                      <div className="student-compact-item static">
                        <div>
                          <strong>Chưa có hoạt động GitHub</strong>
                          <small>Đồng bộ GitHub để xem repository mới.</small>
                        </div>
                        <span>—</span>
                      </div>
                    )}
                    {dashboardOverview.communityItems.map((item) => (
                      <button key={item.title} type="button" className="student-compact-item">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                        <span>→</span>
                      </button>
                    ))}
                  </div>
                </article>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
