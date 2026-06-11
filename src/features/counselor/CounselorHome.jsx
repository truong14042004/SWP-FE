import { useEffect, useState } from 'react';
import '../../styles/counselor.css';
import { CounselorOverview } from './components/CounselorOverview';
import { CounselorStudentList } from './components/CounselorStudentList';
import { CounselorStudentDetail } from './components/CounselorStudentDetail';
import { CounselorFeedbackHistory } from './components/CounselorFeedbackHistory';
import { CounselorWriteFeedbackModal } from './components/CounselorWriteFeedbackModal';
import { RoadmapReviewQueue } from '../roadmap-review/RoadmapReviewQueue';
import { SkillVerificationQueue } from './components/SkillVerificationQueue';
import { RoadmapApprovalQueue } from './components/RoadmapApprovalQueue';
import { NotificationBell } from '../notifications/NotificationBell';
import { DashboardShell } from '@/components/dashboard-shell/DashboardShell';
import {
  getCounselorStudents,
  getMyFeedbacks,
  createFeedback,
  getSkillVerificationQueue,
  getRoadmapApprovalQueue,
} from './api/counselorApi';
import { getCounselorRoadmapQueue } from '../roadmap-review/reviewApi';
import { AnimatePresence, motion } from 'motion/react';

/* ────────────────────────────────────────────────────────────
   Nav icons — small SVGs, follow currentColor.
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
  students: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="7" cy="6" r="3" fill="currentColor" />
      <path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="5.5" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  roadmap: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2" fill="currentColor" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <path d="M4 6v3a3 3 0 0 0 3 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  skillVerify: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 1.5l2.06 1.5 2.55-.02.78 2.43 2.06 1.51-.79 2.42.79 2.43-2.06 1.5-.78 2.43-2.55-.02L9 16.5l-2.06-1.5-2.55.02-.78-2.43L1.55 11l.79-2.43L1.55 6.15l2.06-1.51.78-2.43 2.55.02L9 1.5Z" fill="currentColor" opacity="0.18" />
      <path d="M6 9l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  approval: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3v-3a2 2 0 0 1-1-2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M5.5 6.5h7M5.5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const VIEW_META = {
  overview:           { title: 'Tổng quan',           sub: 'Hoạt động đào tạo & feedback gần đây' },
  students:           { title: 'Sinh viên',           sub: 'Danh sách học viên bạn đang đồng hành' },
  'skill-verifications': { title: 'Duyệt kỹ năng',    sub: 'Hàng chờ xác thực minh chứng kỹ năng' },
  'roadmap-approvals':   { title: 'Duyệt lộ trình',   sub: 'Hàng chờ duyệt khung lộ trình AI đề xuất' },
  'roadmap-reviews':  { title: 'Roadmap reviews',     sub: 'Hàng chờ duyệt tiến độ module học viên' },
  feedback:           { title: 'Lịch sử feedback',    sub: 'Các phản hồi bạn đã gửi' },
};

const VALID_VIEWS = ['overview', 'students', 'skill-verifications', 'roadmap-approvals', 'roadmap-reviews', 'feedback'];

export function CounselorHome({ session, onSignOut }) {
  const getInitialViewInfo = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'counselor' && parts[1]) {
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
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalStudent, setFeedbackModalStudent] = useState(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [skillQueueCount, setSkillQueueCount] = useState(0);
  const [roadmapApprovalCount, setRoadmapApprovalCount] = useState(0);

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
      const [studentsData, feedbacksData, queueData, skillQueueData, roadmapApprovalData] = await Promise.all([
        getCounselorStudents(session).catch(() => []),
        getMyFeedbacks(session).catch(() => []),
        getCounselorRoadmapQueue(session).catch(() => []),
        getSkillVerificationQueue(session).catch(() => []),
        getRoadmapApprovalQueue(session).catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      const pending = (Array.isArray(queueData) ? queueData : [])
        .filter((item) => item.status === 'Pending').length;
      setPendingReviewCount(pending);
      setSkillQueueCount(Array.isArray(skillQueueData) ? skillQueueData.length : 0);
      setRoadmapApprovalCount(Array.isArray(roadmapApprovalData) ? roadmapApprovalData.length : 0);
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(view, studentId = null) {
    setCurrentView(view);
    setSelectedStudentId(studentId);
    window.history.pushState(
      {},
      '',
      studentId ? `/counselor/${view}/${studentId}` : `/counselor/${view}`,
    );
  }

  function handleBack() {
    setSelectedStudentId(null);
    setCurrentView('students');
    window.history.pushState({}, '', '/counselor/students');
  }

  function handleOpenFeedbackModal(student) {
    setFeedbackModalStudent(student);
    setShowFeedbackModal(true);
  }

  async function handleSubmitFeedback(payload) {
    try {
      await createFeedback(session, payload);
      const updated = await getMyFeedbacks(session).catch(() => []);
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

  const counselorName = session?.user?.fullName || 'Counselor';

  const navItems = [
    { id: 'overview',          label: 'Tổng quan',        icon: ICONS.overview },
    { id: 'students',          label: 'Sinh viên',        icon: ICONS.students, badge: students.length || null },
    { id: 'skill-verifications', label: 'Duyệt kỹ năng',  icon: ICONS.skillVerify, badge: skillQueueCount || null },
    { id: 'roadmap-approvals', label: 'Duyệt lộ trình',   icon: ICONS.approval, badge: roadmapApprovalCount || null },
    { id: 'roadmap-reviews',   label: 'Roadmap reviews',  icon: ICONS.roadmap,  badge: pendingReviewCount || null },
    { id: 'feedback',          label: 'Lịch sử feedback', icon: ICONS.feedback, badge: feedbacks.length || null },
  ];

  const meta = VIEW_META[currentView] || VIEW_META.overview;
  // When viewing a student detail, override the title.
  const isStudentDetail = currentView === 'students' && selectedStudentId;
  const topbarTitle = isStudentDetail ? 'Hồ sơ sinh viên' : meta.title;
  const topbarSubtitle = isStudentDetail ? `Mã sinh viên: ${selectedStudentId}` : meta.sub;

  return (
    <>
      <DashboardShell
        brand="CareerMap"
        brandSubtitle="Counselor"
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
              <CounselorOverview
                students={students}
                feedbacks={feedbacks}
                loading={loading}
                counselorName={counselorName}
                onNavigateToStudents={() => handleNavigate('students')}
                onNavigateToStudent={(id) => handleNavigate('students', id)}
                onNavigateToFeedback={() => handleNavigate('feedback')}
              />
            </motion.div>
          )}

          {currentView === 'students' && !selectedStudentId && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CounselorStudentList
                students={students}
                loading={loading}
                onSelectStudent={(id) => handleNavigate('students', id)}
                onOpenFeedbackModal={handleOpenFeedbackModal}
              />
            </motion.div>
          )}

          {currentView === 'students' && selectedStudentId && (
            <motion.div
              key={`student-detail-${selectedStudentId}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <CounselorStudentDetail
                session={session}
                studentId={selectedStudentId}
                students={students}
                onBack={handleBack}
                onOpenFeedbackModal={handleOpenFeedbackModal}
              />
            </motion.div>
          )}

          {currentView === 'skill-verifications' && !selectedStudentId && (
            <motion.div
              key="skill-verifications"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <section className="counselor-section counselor-section--tight">
                <div className="counselor-section-inner counselor-section-inner--wide">
                  <SkillVerificationQueue session={session} />
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'roadmap-approvals' && !selectedStudentId && (
            <motion.div
              key="roadmap-approvals"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <section className="counselor-section counselor-section--tight">
                <div className="counselor-section-inner counselor-section-inner--wide">
                  <RoadmapApprovalQueue session={session} />
                </div>
              </section>
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
              <RoadmapReviewQueue session={session} role="AcademicCounselor" />
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
              <CounselorFeedbackHistory
                feedbacks={feedbacks}
                students={students}
                onSelectStudent={(id) => handleNavigate('students', id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardShell>

      {showFeedbackModal && feedbackModalStudent && (
        <CounselorWriteFeedbackModal
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
