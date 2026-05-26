import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number';
import { Button } from '@/components/animate-ui/components/buttons/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/animate-ui/components/radix/tabs';
import { Fade, Fades } from '@/components/animate-ui/primitives/effects/fade';
import { toast } from 'react-toastify';
import {
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MessageSquareText,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { apiUrl } from '../../config';
import '../../styles/admin.css';
import '../../styles/student.css';
import { StudentProfileForm } from './components/StudentProfileForm';
import '../../styles/student-dashboard.css';
import {
  createStudentProfile,
  getCareerRoles,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
  uploadStudentCv,
} from './studentApi';
import { StudentPortfolioPage } from './components/StudentPortfolioPage';
import { StudentRoadmapPage } from './components/StudentRoadmapPage';
import { StudentSkillsPage } from './components/StudentSkillsPage';
import { StudentGithubPage } from './components/StudentGithubPage';
import { StudentMentorPage } from './components/StudentMentorPage';
import { StudentSubscriptionPage } from './components/StudentSubscriptionPage';
import { StudentFeedbacksPage } from './components/StudentFeedbacksPage';
import { StudentCartPage } from './components/StudentCartPage';
import { MarketPulsePage } from '../market/MarketPulsePage';
import { NotificationBell } from '../notifications/NotificationBell';
import { getGithubRepositories } from './githubApi';
import { getMentorSessions } from './mentorApi';
import { getRoadmapById, getRoadmaps } from './roadmapApi';
import { getLatestSkillGap, getUserSkills, getSignedUrl } from './skillsApi';
const STUDENT_SECTIONS = [
  { id: 'overview', label: 'Bảng điều khiển', Icon: LayoutDashboard },
  { id: 'roadmap', label: 'Lộ trình nghề nghiệp', Icon: MapIcon },
  { id: 'skills', label: 'Kỹ năng & Phân tích', Icon: TrendingUp },
  { id: 'github', label: 'Tích hợp GitHub', Icon: GitBranch },
  { id: 'portfolio', label: 'Xây dựng Portfolio', Icon: BriefcaseBusiness },
  { id: 'mentors', label:'AI tư vấn', Icon: Bot },
  { id: 'market-pulse', label: 'Market Pulse', Icon: TrendingUp },
  { id: 'feedbacks', label: 'Feedback nhận được', Icon: MessageSquareText },
  { id: 'cart', label: 'Giỏ hàng & Lịch sử', Icon: ShoppingCart },
  { id: 'settings', label: 'Cài đặt', Icon: Settings },
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
  'market-pulse': {
    eyebrow: 'Market Pulse',
    title: 'Xu hướng kỹ năng từ tin tuyển dụng',
    subtitle: 'Cập nhật kỹ năng đang được nhà tuyển dụng IT săn lùng nhiều nhất',
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
  cvUrl: '',
  cvName: '',
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function renderStars(count) {
  return Array.from({ length: count }, (_, index) => <Star key={index} size={12} fill="currentColor" aria-hidden="true" />);
}

function AnimatedMetricValue({ value }) {
  const isPercent = String(value || '').endsWith('%');
  const numericString = String(value || '').replace('%', '');
  const parsedVal = parseFloat(numericString);
  if (Number.isNaN(parsedVal)) {
    return <span>{value}</span>;
  }
  return (
    <>
      <CountingNumber as="b" style={{ fontWeight: 'inherit', display: 'inline' }} number={parsedVal} />
      {isPercent ? '%' : ''}
    </>
  );
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
    cvUrl: profile.cvUrl || '',
    cvName: profile.cvName || '',
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

  const nodes = safeArray(roadmap?.nodes)
    .slice()
    .sort((a, b) => {
      const levelA = Number(a.level || 0);
      const levelB = Number(b.level || 0);
      const orderA = Number(a.orderIndex || 0);
      const orderB = Number(b.orderIndex || 0);

      if (levelA !== levelB) return levelA - levelB;
      return orderA - orderB;
    });

  if (!nodes.some((node) => node.parentNodeId)) {
    return nodes;
  }

  const byId = new Map();
  nodes.forEach((node) => {
    byId.set(node.id, { ...node, children: [] });
  });

  const roots = [];
  nodes.forEach((node) => {
    const current = byId.get(node.id);
    const parent = byId.get(node.parentNodeId);

    if (parent) {
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
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

function getNodeProgressFromChildren(node) {
  if (isProgressNode(node)) {
    return isCompletedStatus(node?.status) ? 100 : clampPercent(node?.progress);
  }

  return calculateRoadmapProgress(getChildren(node));
}

function getNodeStatusFromChildren(node) {
  if (isProgressNode(node)) {
    return node?.status;
  }

  const childProgressNodes = flattenRoadmapNodes(getChildren(node)).filter(isProgressNode);

  if (!childProgressNodes.length) {
    return node?.status;
  }

  const completedCount = childProgressNodes.filter((child) => isCompletedStatus(child.status)).length;

  if (completedCount === childProgressNodes.length) return 'Completed';
  if (childProgressNodes.some((child) => normalizeStatus(child.status) === 'needreview' || normalizeStatus(child.status) === 'need_review')) return 'NeedReview';
  if (childProgressNodes.some((child) => !['notstarted', 'not_started', 'pending'].includes(normalizeStatus(child.status)))) return 'InProgress';

  return node?.status;
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
  const progress = getNodeProgressFromChildren(node);
  const status = getNodeStatusFromChildren(node);

  return {
    title: node?.title || node?.name || resource?.title || `Giai đoạn ${index + 1}`,
    detail:
      node?.description ||
      node?.note ||
      resource?.description ||
      resource?.url ||
      'Chưa có mô tả chi tiết.',
    status: getRoadmapStatusLabel(status),
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
    const rawHash = window.location.hash.replace('#', '');
    const hashSection = rawHash.split(/[/?&]/)[0];

    return STUDENT_SECTIONS.some((section) => section.id === hashSection)
      ? hashSection
      : 'overview';
  }

const [activeSection, setActiveSection] = useState(getInitialStudentSection);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const didMountRef = useRef(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState(emptyProfile);
  const [careerRoles, setCareerRoles] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [avatarImportDraft, setAvatarImportDraft] = useState('');
  // Pending avatar: the file user picked but hasn't saved yet. Preview is a local
  // object-URL so it shows immediately without hitting the network.
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState('');
  // Pending CV: stages a CV pick for first-time profile creation. The CV endpoint
  // needs the profile to exist, so we hold the file and upload it after save.
  const [pendingCvFile, setPendingCvFile] = useState(null);
  const [pendingCvName, setPendingCvName] = useState('');
  const [dashboardOverview, setDashboardOverview] = useState(DEFAULT_DASHBOARD_OVERVIEW);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const initials = getInitials(session?.user?.fullName);
  const firstName = session?.user?.fullName?.split(' ')?.slice(-1)?.[0] || 'bạn';
  const sectionMeta = SECTION_META[activeSection] || SECTION_META.overview;
  const avatarSrc = useMemo(() => {
    // Local preview takes top priority so the user sees their pick instantly.
    if (pendingAvatarPreview) return pendingAvatarPreview;
    // form.avatarUrl is the freshest server value (loaded by getStudentProfile);
    // fall back to session.user.avatarUrl only if the form hasn't loaded yet.
    return resolveAvatarSrc(form.avatarUrl || session?.user?.avatarUrl, session?.user?.id);
  }, [pendingAvatarPreview, form.avatarUrl, session?.user?.avatarUrl, session?.user?.id]);

  // Free the blob URL when it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  useEffect(() => {
    loadProfile();
    loadDashboardOverview();
  }, []);

  useEffect(() => {
    function handleHashChange() {
      const rawHash = window.location.hash.replace('#', '');
      const hashSection = rawHash.split(/[/?&]/)[0];
      if (STUDENT_SECTIONS.some((section) => section.id === hashSection)) {
        setActiveSection(hashSection);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load the profile whenever the user lands on the settings tab.
  useEffect(() => {
    if (activeSection === 'settings') {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // First-time onboarding: if the student doesn't have a profile yet, push them
  // straight to the settings tab so they fill in school / major / career goal first.
  // We only do this once per session (forcedOnboardingRef) so the user can leave
  // the settings tab manually after seeing the toast.
  const forcedOnboardingRef = useRef(false);
  useEffect(() => {
    if (loadingProfile) return;
    if (hasProfile) return;
    if (forcedOnboardingRef.current) return;

    forcedOnboardingRef.current = true;
    setActiveSection('settings');
    toast.info('Hãy hoàn tất hồ sơ sinh viên để hệ thống gợi ý lộ trình phù hợp.', {
      autoClose: 6000,
    });
  }, [loadingProfile, hasProfile]);

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

  function navigateStudentSection(sectionId) {
    if (sectionId === activeSection && sectionId === 'overview') {
      loadDashboardOverview();
    }

    setActiveSection(sectionId);
    window.history.replaceState({}, '', `#${sectionId}`);
  }
  function handleNotificationNavigate(target) {
  const normalizedTarget = String(target || '').trim();

  const rawSection = normalizedTarget
    .replace(/^#/, '')
    .replace(/^\//, '')
    .split('#')
    .pop()
    .split(/[/?&]/)[0];

  const sectionId = STUDENT_SECTIONS.some((section) => section.id === rawSection)
    ? rawSection
    : 'roadmap';

  navigateStudentSection(sectionId);
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
      toast.error(requestError.message || 'Không thể tải hồ sơ sinh viên.');
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

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    // Replace any previous pending preview before creating a new one.
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingAvatarFile(file);
    setPendingAvatarPreview(previewUrl);
  }

  function clearPendingAvatar() {
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreview('');
  }

  async function handleAvatarImport() {
    const avatarUrl = avatarImportDraft.trim();
    if (!avatarUrl) {
      toast.error('Vui lòng nhập URL ảnh đại diện.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileName = avatarUrl.split('/').pop()?.split('?')[0] || 'avatar';
      const imported = await importStudentAvatarFromUrl(session, { url: avatarUrl, fileName });
      const nextAvatarUrl = imported?.downloadPath || imported?.objectName || avatarUrl;
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      setAvatarImportDraft('');
      toast.success('Đã nhập ảnh đại diện từ URL.');
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể nhập ảnh đại diện từ URL.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCvFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    // First-time profile creation: the CV endpoint requires a profile to exist,
    // so stage the file and upload it inside the save flow.
    if (!hasProfile) {
      setPendingCvFile(file);
      setPendingCvName(file.name);
      return;
    }

    setUploadingCv(true);
    try {
      const uploaded = await uploadStudentCv(session, file);
      setForm(normalizeProfile(uploaded));
      toast.success('Đã tải lên CV thành công.');
    } catch (requestError) {
      toast.error(requestError.message || 'Không tải được CV.');
    } finally {
      setUploadingCv(false);
    }
  }

  function clearPendingCv() {
    setPendingCvFile(null);
    setPendingCvName('');
  }

  async function handleViewCv(event) {
    event.preventDefault();
    if (!form.cvUrl) {
      return;
    }

    try {
      const response = await getSignedUrl(session, form.cvUrl);
      if (response?.url) {
        window.open(response.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error("Không lấy được đường dẫn tải file CV.");
      }
    } catch (requestError) {
      toast.error(requestError.message || "Không thể tải CV.");
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    const wasNewProfile = !hasProfile;
    try {
      let workingForm = form;

      // 1) If a new avatar was picked, upload it first and merge its URL into the
      //    payload we're about to save.
      if (pendingAvatarFile) {
        setUploadingAvatar(true);
        try {
          const uploaded = await uploadStudentAvatar(session, pendingAvatarFile);
          const uploadedAvatarUrl = normalizeProfile(uploaded).avatarUrl;
          workingForm = { ...form, avatarUrl: uploadedAvatarUrl };
          setForm(workingForm);
          // Uploading the avatar creates the profile server-side, so we can use
          // the update endpoint for the rest of the fields.
          setHasProfile(true);
        } finally {
          setUploadingAvatar(false);
        }
      }

      // 2) Persist the rest of the profile.
      const payload = profilePayload(workingForm);
      const useUpdate = hasProfile || Boolean(pendingAvatarFile);
      const saved = useUpdate
        ? await updateStudentProfile(session, payload)
        : await createStudentProfile(session, payload);

      let savedForm = normalizeProfile(saved);
      setForm(savedForm);
      setHasProfile(true);

      // 3) If a CV was staged before the profile existed, upload it now.
      if (pendingCvFile) {
        setUploadingCv(true);
        try {
          const uploadedCv = await uploadStudentCv(session, pendingCvFile);
          savedForm = normalizeProfile(uploadedCv);
          setForm(savedForm);
        } finally {
          setUploadingCv(false);
        }
      }

      // 4) Clear pending state — the saved profile now owns both files.
      clearPendingAvatar();
      clearPendingCv();

      toast.success(wasNewProfile ? 'Đã tạo hồ sơ.' : 'Đã cập nhật hồ sơ.');
    } catch (requestError) {
      toast.error(requestError.message || 'Không thể lưu hồ sơ.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className={`admin-shell student-shell ${sidebarCollapsed ? 'student-shell-collapsed' : ''}`}>
      <aside className={`admin-sidebar student-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button type="button" className="student-brand" onClick={onNavigateHome}>
          <span className="student-brand-mark">SWP</span>
          <div className="student-brand-copy">
            <strong>Career Compass</strong>
            <span>Chào mừng {firstName} quay trở lại</span>
          </div>
        </button>
        <button
            type="button"
            className="student-sidebar-toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
            title={sidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
          </button>

        <nav className="admin-nav student-nav" aria-label="Student sections">
          {STUDENT_SECTIONS.map((section) => {
            const SectionIcon = section.Icon;
            const isActive = activeSection === section.id;
            return (
            <button
              key={section.id}
              type="button"
              onClick={() => navigateStudentSection(section.id)}
              title={sidebarCollapsed ? section.label : undefined}
              style={{
                color: isActive ? '#ffffff' : undefined,
                position: 'relative',
                background: 'transparent'
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    zIndex: 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <SectionIcon className="student-nav-icon" size={18} aria-hidden="true" style={{ position: 'relative', zIndex: 1 }} />
              <span className="student-nav-label" style={{ position: 'relative', zIndex: 1 }}>{section.label}</span>
            </button>
            );
          })}
        </nav>

        <div className="student-sidebar-footer">
          <button
            type="button"
            className="student-upgrade-btn"
            onClick={() => setActiveSection('subscription')}
          >
            <Sparkles size={18} aria-hidden="true" />
            <span>Nâng cấp tài khoản</span>
          </button>
          <div className="admin-account">
            <div className="admin-account-info">
              {avatarSrc ? (
                <img className="admin-account-avatar" src={avatarSrc} alt="Student avatar" />
              ) : (
                <span className="admin-account-avatar">{initials}</span>
              )}
              <div className="admin-account-copy">
                <strong>{session?.user?.fullName}</strong>
                <small>{session?.user?.email}</small>
              </div>
            </div>
            <button type="button" onClick={onSignOut}>
              <LogOut size={16} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      <section className="admin-main student-main">
<header className="student-header-bar">
  <button
    type="button"
    className="student-search-bar"
    onClick={() => navigateStudentSection('skills')}
  >
    <Search size={16} aria-hidden="true" />
    Tìm kiếm khóa học, mentor, kỹ năng...
  </button>

  <div className="student-header-actions">
    <NotificationBell
      session={session}
      onNavigate={handleNotificationNavigate}
    />
  </div>
</header>

     {activeSection === 'portfolio' ? (
  <Fade inView={false}><StudentPortfolioPage session={session} /></Fade>
) : activeSection === 'roadmap' ? (
  <Fade inView={false}><StudentRoadmapPage session={session} /></Fade>
) : activeSection === 'skills' ? (
  <Fade inView={false}><StudentSkillsPage session={session} /></Fade>
) : activeSection === 'github' ? (
  <Fade inView={false}><StudentGithubPage session={session} /></Fade>
) : activeSection === 'mentors' ? (
  <Fade inView={false}><StudentMentorPage session={session} /></Fade>
) : activeSection === 'market-pulse' ? (
  <Fade inView={false}><MarketPulsePage embedded /></Fade>
) : activeSection === 'subscription' ? (
  <Fade inView={false}><StudentSubscriptionPage session={session} /></Fade>
) : activeSection === 'feedbacks' ? (
  <Fade inView={false}><StudentFeedbacksPage session={session} /></Fade>
) : activeSection === 'cart' ? (
  <Fade inView={false}><StudentCartPage session={session} /></Fade>
) : activeSection === 'settings' ? (
          <section className="student-profile-page">
            <Fade inView={false}>
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
                uploadingCv={uploadingCv}
                hasProfile={hasProfile}
                onChange={updateField}
                onAvatarFileChange={handleAvatarFileChange}
                onCvFileChange={handleCvFileChange}
                onAvatarImport={handleAvatarImport}
                onViewCv={handleViewCv}
                onSubmit={handleSaveProfile}
                hasPendingAvatar={Boolean(pendingAvatarFile)}
                onCancelPendingAvatar={clearPendingAvatar}
                pendingCvName={pendingCvName}
                onCancelPendingCv={clearPendingCv}
              />
            </Fade>
          </section>
        ) : (
          <Fade inView={false}>
            <header className="student-topbar">
              <motion.div
                key={activeSection}
                className="student-topbar-copy"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1>{sectionMeta.title}</h1>
                <p>{sectionMeta.subtitle} <strong>{targetRoleName}</strong>.</p>
              </motion.div>
              <div className="student-topbar-actions">
  <button
    type="button"
    className="student-secondary-btn"
    onClick={() => navigateStudentSection('settings')}
  >
    Cập nhật hồ sơ
  </button>

  <button
    type="button"
    className="student-cta-btn"
    onClick={() => navigateStudentSection('roadmap')}
  >
    Tạo lộ trình cá nhân hóa
  </button>
</div>
            </header>

            {loadingOverview && (
              <p className="student-overview-loading">Đang tải dữ liệu bảng điều khiển...</p>
            )}

            <section className="student-overview-grid" aria-label="Student metrics">
              <Fades inView={false} delay={100} holdDelay={80}>
                {dashboardOverview.metrics.map((metric) => (
                  <motion.article
                    key={metric.label}
                    className={`student-metric-card ${metric.tone}`}
                    whileHover={{ y: -4, scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span>{metric.label}</span>
                    <strong>
                      <AnimatedMetricValue value={metric.value} />
                    </strong>
                    <small>{metric.caption}</small>
                  </motion.article>
                ))}
              </Fades>
            </section>

            <section className="student-dashboard-layout">
              <motion.article
                className="student-score-card"
                whileHover={{ y: -4, scale: 1.01, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="student-panel-heading">
                  <span>Readiness</span>
                  <h2>Độ phù hợp</h2>
                  <p>Mức độ sẵn sàng hiện tại cho vai trò {targetRoleName}</p>
                </div>

                <div
                  className="student-score-ring"
                  style={{ '--score-angle': `${Math.min(Math.max(dashboardOverview.score, 0), 100) * 3.6}deg` }}
                >
                  <div className="student-score-ring-inner">
                    <strong>
                      <CountingNumber as="b" style={{ fontWeight: 'inherit', display: 'inline' }} number={dashboardOverview.score} />%
                    </strong>
                    <span>Match score</span>
                  </div>
                </div>

                <div className="student-score-stats">
                  <div>
                    <strong>
                      <CountingNumber as="b" style={{ fontWeight: 'inherit', display: 'inline' }} number={dashboardOverview.scoreStats.done} />
                    </strong>
                    <span>Đã đạt</span>
                  </div>
                  <div>
                    <strong>
                      <CountingNumber as="b" style={{ fontWeight: 'inherit', display: 'inline' }} number={dashboardOverview.scoreStats.weak} />
                    </strong>
                    <span>Còn yếu</span>
                  </div>
                  <div>
                    <strong>
                      <CountingNumber as="b" style={{ fontWeight: 'inherit', display: 'inline' }} number={dashboardOverview.scoreStats.missing} />
                    </strong>
                    <span>Thiếu</span>
                  </div>
                </div>
              </motion.article>

              <motion.article
                className="student-roadmap-card"
                whileHover={{ y: -4, scale: 1.01, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Roadmap</span>
                    <h2>Lộ trình 4 giai đoạn</h2>
                  </div>
                  <button type="button" onClick={() => navigateStudentSection('roadmap')}>Xem chi tiết</button>
                </div>

                <div className="student-roadmap-list">
                  {dashboardOverview.roadmapSteps.length === 0 ? (
                    <div className="student-compact-item static">
                      <div>
                        <strong>Chưa có lộ trình</strong>
                        <small>Vào trang Lộ trình nghề nghiệp để tạo roadmap mới.</small>
                      </div>
                      <span>0%</span>
                    </div>
                  ) : (
                    <Fades inView={false} delay={100} holdDelay={80}>
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
                              <motion.span
                                initial={{ width: '0%' }}
                                animate={{ width: `${step.progress}%` }}
                                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </Fades>
                  )}
                </div>
              </motion.article>
            </section>

            <section className="student-content-grid">
              <article className="student-gap-panel">
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Skill gap</span>
                    <h2>Kỹ năng cần tập trung</h2>
                  </div>
                </div>

                <div className="student-skill-tabs" style={{ position: 'relative', zIndex: 1 }}>
                  {skillTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={isActive ? 'active' : ''}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          background: 'transparent',
                          position: 'relative',
                          color: isActive ? '#ffffff' : undefined,
                          boxShadow: isActive ? 'none' : undefined,
                          zIndex: 1
                        }}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="skill-active-indicator"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: '#0f172a',
                              borderRadius: '14px',
                              zIndex: -1,
                              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.14)'
                            }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {visibleGroups.includes('missing') && (
                  <div className="student-group">
                    <h3 className="student-group-title danger">Kỹ năng đang thiếu</h3>
                    {dashboardOverview.skillGroups.missing.length === 0 ? (
                      <p className="student-empty-note">Chưa có kỹ năng thiếu từ báo cáo skill gap.</p>
                    ) : (
                      <Fades inView={false} delay={100} holdDelay={60}>
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
                      </Fades>
                    )}
                  </div>
                )}

                {visibleGroups.includes('weak') && (
                  <div className="student-group">
                    <h3 className="student-group-title warning">Kỹ năng cần cải thiện</h3>
                    {dashboardOverview.skillGroups.weak.length === 0 ? (
                      <p className="student-empty-note">Chưa có kỹ năng yếu cần cải thiện.</p>
                    ) : (
                      <Fades inView={false} delay={100} holdDelay={60}>
                        {dashboardOverview.skillGroups.weak.map((skill) => (
                          <div key={skill.name} className="student-skill-card weak">
                            <div>
                              <div className="student-skill-title">
                                <strong>{skill.name}</strong>
                                <span className="student-stars">{renderStars(3)}</span>
                              </div>
                              <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                              <div className="student-progress">
                                <motion.span
                                  initial={{ width: '0%' }}
                                  animate={{ width: `${skill.progress}%` }}
                                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                                />
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
                      </Fades>
                    )}
                  </div>
                )}

                {visibleGroups.includes('done') && (
                  <div className="student-group">
                    <h3 className="student-group-title success">Kỹ năng đã đạt</h3>
                    {dashboardOverview.skillGroups.done.length === 0 ? (
                      <p className="student-empty-note">Chưa có kỹ năng đã đạt hoặc đã xác minh.</p>
                    ) : (
                      <Fades inView={false} delay={100} holdDelay={60}>
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
                      </Fades>
                    )}
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
                    {dashboardOverview.learningQueue.length === 0 ? (
                      <div className="student-compact-item static">
                        <div>
                          <strong>Chưa có khóa học ưu tiên</strong>
                          <small>Phân tích skill gap để hệ thống gợi ý.</small>
                        </div>
                        <span>—</span>
                      </div>
                    ) : (
                      <Fades inView={false} delay={100} holdDelay={60}>
                        {dashboardOverview.learningQueue.map((item) => (
                          <button key={item.title} type="button" className="student-compact-item">
                            <div>
                              <strong>{item.title}</strong>
                              <small>{item.duration}</small>
                            </div>
                            <span>{item.level}</span>
                          </button>
                        ))}
                      </Fades>
                    )}
                  </div>
                </article>


                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>GitHub</span>
                    <h2>Repository mới</h2>
                  </div>
                  <div className="student-compact-list">
                    {dashboardOverview.communityItems.length === 0 ? (
                      <div className="student-compact-item static">
                        <div>
                          <strong>Chưa có hoạt động GitHub</strong>
                          <small>Đồng bộ GitHub để xem repository mới.</small>
                        </div>
                        <span>—</span>
                      </div>
                    ) : (
                      <Fades inView={false} delay={100} holdDelay={60}>
                        {dashboardOverview.communityItems.map((item) => (
                          <button key={item.title} type="button" className="student-compact-item">
                            <div>
                              <strong>{item.title}</strong>
                              <small>{item.meta}</small>
                            </div>
                            <span>→</span>
                          </button>
                        ))}
                      </Fades>
                    )}
                  </div>
                </article>
              </aside>
            </section>
          </Fade>
        )}
      </section>
    </main>
  );
}
