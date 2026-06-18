import { useEffect, useState } from 'react';
import '../../styles/industry-mentor.css';
import '../../styles/admin.css';
import { MentorOverview } from './components/MentorOverview';
import { MentorReviewQueue } from './components/MentorReviewQueue';
import { MentorStudentDetail } from './components/MentorStudentDetail';
import { MentorFeedbackHistory } from './components/MentorFeedbackHistory';
import { MentorWriteFeedbackModal } from './components/MentorWriteFeedbackModal';
import { RoadmapReviewQueue } from '../roadmap-review/RoadmapReviewQueue';
import { MentorProfileView } from './components/MentorProfileView';
import { NotificationBell } from '../notifications/NotificationBell';
import { DashboardShell } from '@/components/dashboard-shell/DashboardShell';
import { SkillsView } from './views/SkillsView';
import { ResourcesView } from './views/ResourcesView';
import { RequirementsView } from './views/RequirementsView';
import { PrerequisitesView } from './views/PrerequisitesView';
import { CareerRolesView } from './views/CareerRolesView';
import { AutoEvolveView } from './views/AutoEvolveView';
import {
  getReviewQueue,
  getMyMentorFeedbacks,
  createMentorFeedback,
  getCatalog,
  getSkill,
  saveSkill,
  deleteSkill,
  getLearningResource,
  getLearningResourceSignedUrl,
  saveLearningResource,
  deleteLearningResource,
  getRoleSkillRequirement,
  saveRoleSkillRequirement,
  deleteRoleSkillRequirement,
  saveSkillPrerequisite,
  deleteSkillPrerequisite,
  getCareerRole,
  saveCareerRole,
  deleteCareerRole,
} from './api/industryMentorApi';
import { getMentorRoadmapQueue } from '../roadmap-review/reviewApi';
import { AnimatePresence, motion } from 'motion/react';

/* ────────────────────────────────────────────────────────────
   Nav icons
   ──────────────────────────────────────────────────────────── */
const ICONS = {
  overview: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="3" width="14" height="3" rx="1" fill="currentColor" />
      <rect x="2" y="8" width="14" height="3" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="2" y="13" width="9" height="3" rx="1" fill="currentColor" opacity="0.45" />
    </svg>
  ),
  roadmap: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2" fill="currentColor" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <path d="M4 6v3a3 3 0 0 0 3 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3v-3a2 2 0 0 1-1-2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M5.5 6.5h7M5.5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 15.5c0-3 2.5-5.5 6.5-5.5s6.5 2.5 6.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2L11 7H16L12 10.5L13.5 16L9 13L4.5 16L6 10.5L2 7H7L9 2Z" fill="currentColor" />
    </svg>
  ),
  resources: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  requirements: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 5h12M3 9h8M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="13" r="2.5" fill="currentColor" />
    </svg>
  ),
  prerequisites: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 7l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  careerRoles: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="6" y="1" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6v3M9 9H3.5v3M9 9h5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  autoEvolve: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 1L11.5 6.5L17 9L11.5 11.5L9 17L6.5 11.5L1 9L6.5 6.5L9 1Z" fill="currentColor" />
    </svg>
  ),
};

const VIEW_META = {
  overview:          { title: 'Tổng quan',         sub: 'Hoạt động review và phản hồi gần đây' },
  queue:             { title: 'Review queue',      sub: 'Hàng chờ review từ học viên' },
  'roadmap-reviews': { title: 'Roadmap reviews',   sub: 'Hàng chờ duyệt lộ trình' },
  feedback:          { title: 'Lịch sử feedback',  sub: 'Phản hồi bạn đã gửi' },
  profile:           { title: 'Hồ sơ cá nhân',     sub: 'Quản lý thông tin và ảnh đại diện của bạn' },
  skills:            { title: 'Kỹ năng',           sub: 'Quản lý danh mục kỹ năng' },
  resources:         { title: 'Tài nguyên học tập', sub: 'Bài viết, video, tệp đính kèm' },
  requirements:      { title: 'Yêu cầu theo vai trò', sub: 'Kỹ năng gắn với định hướng nghề nghiệp' },
  prerequisites:     { title: 'Kỹ năng tiên quyết', sub: 'Kỹ năng cần học trước' },
  'career-roles':    { title: 'Định hướng nghề nghiệp', sub: 'Các vai trò mục tiêu cho học viên' },
  'auto-evolve':     { title: 'AI Auto-Evolve',    sub: 'Đề xuất lộ trình do AI sinh ra' },
};

const VALID_VIEWS = [
  'overview', 'queue', 'roadmap-reviews', 'feedback', 'profile',
  'skills', 'resources', 'requirements', 'prerequisites', 'career-roles', 'auto-evolve',
];

export function MentorHome({ session, onSignOut }) {
  const getInitialViewInfo = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'mentor' && parts[1]) {
      const view = parts[1];
      if (VALID_VIEWS.includes(view)) {
        return { view, studentId: parts[2] || null };
      }
    }
    return { view: 'overview', studentId: null };
  };

  const initialInfo = getInitialViewInfo();
  const [currentView, setCurrentView] = useState(initialInfo.view);
  const [selectedStudentId, setSelectedStudentId] = useState(initialInfo.studentId);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalStudent, setFeedbackModalStudent] = useState(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [catalog, setCatalog] = useState({
    skills: [],
    learningResources: [],
    roleSkillRequirements: [],
    careerRoles: [],
    skillPrerequisites: [],
  });

  useEffect(() => {
    loadInitialData();
    const handlePopState = () => {
      const info = getInitialViewInfo();
      setCurrentView(info.view);
      setSelectedStudentId(info.studentId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [queueData, feedbacksData, roadmapQueueData, catalogData] = await Promise.all([
        getReviewQueue(session).catch(() => []),
        getMyMentorFeedbacks(session).catch(() => []),
        getMentorRoadmapQueue(session).catch(() => []),
        getCatalog(session).catch(() => null),
      ]);
      setReviewQueue(Array.isArray(queueData) ? queueData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      const pending = (Array.isArray(roadmapQueueData) ? roadmapQueueData : [])
        .filter((item) => item.status === 'Pending').length;
      setPendingReviewCount(pending);
      if (catalogData) setCatalog(catalogData);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCatalog() {
    const data = await getCatalog(session).catch(() => null);
    if (data) setCatalog(data);
  }

  async function runCatalogAction(action) {
    try {
      await action();
      await refreshCatalog();
    } catch (requestError) {
      alert(requestError?.message || 'Đã xảy ra lỗi.');
    }
  }

  /* Skills */
  const handleLoadSkill = (id) => getSkill(session, id);
  const handleSaveSkill = (skill, id) => runCatalogAction(() => saveSkill(session, skill, id));
  const handleDeleteSkill = (skill) => runCatalogAction(() => deleteSkill(session, skill.id));

  /* Learning resources */
  const handleLoadResource = (id) => getLearningResource(session, id);
  const handleOpenResource = (resource) => getLearningResourceSignedUrl(session, resource.id);
  const handleSaveResource = (resource, id) => runCatalogAction(() => saveLearningResource(session, resource, id));
  const handleDeleteResource = (resource) => runCatalogAction(() => deleteLearningResource(session, resource.id));

  /* Role skill requirements */
  const handleLoadRequirement = (id) => getRoleSkillRequirement(session, id);
  const handleSaveRequirement = (requirement, id) => runCatalogAction(() => saveRoleSkillRequirement(session, requirement, id));
  const handleDeleteRequirement = (requirement) => runCatalogAction(() => deleteRoleSkillRequirement(session, requirement.id));

  /* Skill prerequisites */
  const handleSavePrerequisite = (prerequisite) => runCatalogAction(() => saveSkillPrerequisite(session, prerequisite));
  const handleDeletePrerequisite = (prerequisite) => runCatalogAction(() => deleteSkillPrerequisite(session, prerequisite.id));

  /* Career roles */
  const handleLoadCareerRole = (id) => getCareerRole(session, id);
  const handleSaveCareerRole = (careerRole, id) => runCatalogAction(() => saveCareerRole(session, careerRole, id));
  const handleDeleteCareerRole = (careerRole) => runCatalogAction(() => deleteCareerRole(session, careerRole));

  function handleNavigate(view, studentId = null) {
    setCurrentView(view);
    setSelectedStudentId(studentId);
    window.history.pushState(
      {},
      '',
      studentId ? `/mentor/${view}/${studentId}` : `/mentor/${view}`,
    );
  }

  function handleSelectStudent(studentId) {
    handleNavigate('queue', studentId);
  }

  function handleBack() {
    setSelectedStudentId(null);
    setCurrentView('queue');
    window.history.pushState({}, '', '/mentor/queue');
  }

  function handleOpenFeedbackModal(student) {
    setFeedbackModalStudent(student);
    setShowFeedbackModal(true);
  }

  async function handleSubmitFeedback(payload) {
    try {
      await createMentorFeedback(session, payload);
      const updated = await getMyMentorFeedbacks(session).catch(() => []);
      setFeedbacks(Array.isArray(updated) ? updated : []);
      setShowFeedbackModal(false);
      setFeedbackModalStudent(null);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Không thể gửi feedback',
      };
    }
  }

  const mentorName = session?.user?.fullName || 'Mentor';

  const navItems = [
    { id: 'overview',          label: 'Tổng quan',        icon: ICONS.overview },
    { id: 'queue',             label: 'Review queue',     icon: ICONS.queue,    badge: reviewQueue.length || null },
    { id: 'roadmap-reviews',   label: 'Roadmap reviews',  icon: ICONS.roadmap,  badge: pendingReviewCount || null },
    { id: 'feedback',          label: 'Lịch sử feedback', icon: ICONS.feedback, badge: feedbacks.length || null },
    { id: 'skills',            label: 'Kỹ năng',          icon: ICONS.skills },
    { id: 'resources',         label: 'Tài nguyên',       icon: ICONS.resources },
    { id: 'requirements',      label: 'Yêu cầu vai trò',  icon: ICONS.requirements },
    { id: 'prerequisites',     label: 'Kỹ năng tiên quyết', icon: ICONS.prerequisites },
    { id: 'career-roles',      label: 'Định hướng',       icon: ICONS.careerRoles },
    { id: 'auto-evolve',       label: 'AI Auto-Evolve',   icon: ICONS.autoEvolve },
    { id: 'profile',           label: 'Hồ sơ cá nhân',    icon: ICONS.profile },
  ];

  const meta = VIEW_META[currentView] || VIEW_META.overview;
  const isStudentDetail = currentView === 'queue' && selectedStudentId;
  const topbarTitle = isStudentDetail ? 'Hồ sơ sinh viên' : meta.title;
  const topbarSubtitle = isStudentDetail ? `Mã sinh viên: ${selectedStudentId}` : meta.sub;

  return (
    <>
      <DashboardShell
        brand="CareerMap"
        brandSubtitle="Industry Mentor"
        navItems={navItems}
        activeId={selectedStudentId ? null : currentView}
        onNavigate={(id) => handleNavigate(id)}
        session={session}
        onSignOut={onSignOut}
        topbarTitle={topbarTitle}
        topbarSubtitle={topbarSubtitle}
        topbarActions={
          <NotificationBell
            session={session}
            onNavigate={(target) => {
              const view = target === 'roadmap-reviews' ? 'roadmap-reviews' : 'overview';
              handleNavigate(view);
            }}
          />
        }
      >
        <AnimatePresence mode="wait">
          {currentView === 'overview' && !selectedStudentId && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <MentorOverview
                reviewQueue={reviewQueue}
                feedbacks={feedbacks}
                loading={loading}
                mentorName={mentorName}
                onNavigateToQueue={() => handleNavigate('queue')}
                onNavigateToFeedback={() => handleNavigate('feedback')}
                onSelectStudent={handleSelectStudent}
              />
            </motion.div>
          )}

          {currentView === 'queue' && !selectedStudentId && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <MentorReviewQueue
                reviewQueue={reviewQueue}
                loading={loading}
                onSelectStudent={handleSelectStudent}
                onWriteFeedback={handleOpenFeedbackModal}
              />
            </motion.div>
          )}

          {currentView === 'queue' && selectedStudentId && (
            <motion.div
              key={`student-detail-${selectedStudentId}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <MentorStudentDetail
                session={session}
                studentId={selectedStudentId}
                reviewQueue={reviewQueue}
                onBack={handleBack}
                onWriteFeedback={handleOpenFeedbackModal}
              />
            </motion.div>
          )}

          {currentView === 'roadmap-reviews' && (
            <motion.div
              key="roadmap-reviews"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <RoadmapReviewQueue session={session} role="IndustryMentor" />
            </motion.div>
          )}

          {currentView === 'feedback' && !selectedStudentId && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <MentorFeedbackHistory
                feedbacks={feedbacks}
                reviewQueue={reviewQueue}
                onSelectStudent={handleSelectStudent}
              />
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <MentorProfileView session={session} />
            </motion.div>
          )}

          {currentView === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <SkillsView
                skills={catalog.skills}
                onLoadSkill={handleLoadSkill}
                onSaveSkill={handleSaveSkill}
                onDeleteSkill={handleDeleteSkill}
              />
            </motion.div>
          )}

          {currentView === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ResourcesView
                resources={catalog.learningResources}
                skills={catalog.skills}
                onLoadResource={handleLoadResource}
                onOpenResource={handleOpenResource}
                onSaveResource={handleSaveResource}
                onDeleteResource={handleDeleteResource}
              />
            </motion.div>
          )}

          {currentView === 'requirements' && (
            <motion.div
              key="requirements"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <RequirementsView
                requirements={catalog.roleSkillRequirements}
                careerRoles={catalog.careerRoles}
                skills={catalog.skills}
                onLoadRequirement={handleLoadRequirement}
                onSaveRequirement={handleSaveRequirement}
                onDeleteRequirement={handleDeleteRequirement}
              />
            </motion.div>
          )}

          {currentView === 'prerequisites' && (
            <motion.div
              key="prerequisites"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <PrerequisitesView
                prerequisites={catalog.skillPrerequisites}
                skills={catalog.skills}
                onSavePrerequisite={handleSavePrerequisite}
                onDeletePrerequisite={handleDeletePrerequisite}
              />
            </motion.div>
          )}

          {currentView === 'career-roles' && (
            <motion.div
              key="career-roles"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CareerRolesView
                careerRoles={catalog.careerRoles}
                onLoadCareerRole={handleLoadCareerRole}
                onSaveCareerRole={handleSaveCareerRole}
                onDeleteCareerRole={handleDeleteCareerRole}
              />
            </motion.div>
          )}

          {currentView === 'auto-evolve' && (
            <motion.div
              key="auto-evolve"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <AutoEvolveView session={session} />
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardShell>

      {showFeedbackModal && feedbackModalStudent && (
        <MentorWriteFeedbackModal
          session={session}
          student={feedbackModalStudent}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackModalStudent(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </>
  );
}
