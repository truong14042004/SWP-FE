import { useEffect, useState } from 'react';
import '../../styles/industry-mentor.css';
import { MentorOverview } from './components/MentorOverview';
import { MentorReviewQueue } from './components/MentorReviewQueue';
import { MentorStudentDetail } from './components/MentorStudentDetail';
import { MentorFeedbackHistory } from './components/MentorFeedbackHistory';
import { MentorWriteFeedbackModal } from './components/MentorWriteFeedbackModal';
import { RoadmapReviewQueue } from '../roadmap-review/RoadmapReviewQueue';
import { NotificationBell } from '../notifications/NotificationBell';
import { DashboardShell } from '@/components/dashboard-shell/DashboardShell';
import {
  getReviewQueue,
  getMyMentorFeedbacks,
  createMentorFeedback,
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
};

const VIEW_META = {
  overview:          { title: 'Tổng quan',         sub: 'Hoạt động review và phản hồi gần đây' },
  queue:             { title: 'Review queue',      sub: 'Hàng chờ review từ học viên' },
  'roadmap-reviews': { title: 'Roadmap reviews',   sub: 'Hàng chờ duyệt lộ trình' },
  feedback:          { title: 'Lịch sử feedback',  sub: 'Phản hồi bạn đã gửi' },
};

const VALID_VIEWS = ['overview', 'queue', 'roadmap-reviews', 'feedback'];

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
      const [queueData, feedbacksData, roadmapQueueData] = await Promise.all([
        getReviewQueue(session).catch(() => []),
        getMyMentorFeedbacks(session).catch(() => []),
        getMentorRoadmapQueue(session).catch(() => []),
      ]);
      setReviewQueue(Array.isArray(queueData) ? queueData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      const pending = (Array.isArray(roadmapQueueData) ? roadmapQueueData : [])
        .filter((item) => item.status === 'Pending').length;
      setPendingReviewCount(pending);
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
