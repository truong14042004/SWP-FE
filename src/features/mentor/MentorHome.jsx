import { useEffect, useState } from 'react';
import '../../styles/industry-mentor.css';
import { MentorOverview } from './components/MentorOverview';
import { MentorReviewQueue } from './components/MentorReviewQueue';
import { MentorStudentDetail } from './components/MentorStudentDetail';
import { MentorFeedbackHistory } from './components/MentorFeedbackHistory';
import { MentorWriteFeedbackModal } from './components/MentorWriteFeedbackModal';
import { RoadmapReviewQueue } from '../roadmap-review/RoadmapReviewQueue';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  getReviewQueue,
  getMyMentorFeedbacks,
  createMentorFeedback,
} from './api/industryMentorApi';
import { getMentorRoadmapQueue } from '../roadmap-review/reviewApi';
import { Highlight } from '@/components/animate-ui/primitives/effects/highlight';
import { AnimatePresence, motion } from 'motion/react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'queue', label: 'Review queue' },
  { id: 'roadmap-reviews', label: 'Roadmap reviews' },
  { id: 'feedback', label: 'Lịch sử feedback' },
];

export function MentorHome({ session, onSignOut }) {
  const getInitialViewInfo = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'mentor' && parts[1]) {
      const view = parts[1];
      const validViews = ['overview', 'queue', 'roadmap-reviews', 'feedback'];
      if (validViews.includes(view)) {
        return {
          view,
          studentId: parts[2] || null
        };
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

  return (
    <div className="imentor-shell">
      <header className="imentor-globalnav">
        <div className="imentor-globalnav-inner">
          <span className="imentor-globalnav-brand">
            <span className="imentor-globalnav-brand-dot" aria-hidden>
              C
            </span>
            CareerMap
          </span>
          <span className="imentor-globalnav-spacer" />
          <span className="imentor-globalnav-meta">
            Đăng nhập:<strong>{mentorName}</strong>
          </span>
          <NotificationBell
            session={session}
            onNavigate={(target) => {
              const view = target === 'roadmap-reviews' ? 'roadmap-reviews' : 'overview';
              handleNavigate(view);
            }}
          />
          <button
            type="button"
            className="imentor-globalnav-action"
            onClick={onSignOut}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <nav className="imentor-subnav" aria-label="Mentor sections">
        <div className="imentor-subnav-inner">
          <span className="imentor-subnav-title">Industry Mentor</span>
          <div className="imentor-subnav-links">
            <Highlight
              value={selectedStudentId ? null : currentView}
              onValueChange={(val) => {
                if (val) handleNavigate(val);
              }}
              className="absolute inset-0 bg-[rgba(0,102,204,0.08)] rounded-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              hover={false}
              click={true}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id && !selectedStudentId;
                const badge =
                  item.id === 'queue' && reviewQueue.length > 0
                    ? reviewQueue.length
                    : item.id === 'roadmap-reviews' && pendingReviewCount > 0
                    ? pendingReviewCount
                    : item.id === 'feedback' && feedbacks.length > 0
                    ? feedbacks.length
                    : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-value={item.id}
                    className={`imentor-subnav-link relative z-10 ${isActive ? 'active' : ''}`}
                    style={{ background: 'transparent' }}
                  >
                    {item.label}
                    {badge != null && (
                      <span className="imentor-subnav-badge">{badge}</span>
                    )}
                  </button>
                );
              })}
            </Highlight>
          </div>
          <span className="imentor-subnav-spacer" />
          {currentView === 'queue' && !selectedStudentId && reviewQueue.length > 0 && (
            <button
              type="button"
              className="imentor-subnav-cta"
              onClick={() => handleNavigate('feedback')}
            >
              Xem lịch sử
            </button>
          )}
        </div>
      </nav>

      <main className="imentor-main">
        <AnimatePresence mode="wait">
          {currentView === 'overview' && !selectedStudentId && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <RoadmapReviewQueue session={session} role="IndustryMentor" />
            </motion.div>
          )}

          {currentView === 'feedback' && !selectedStudentId && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <MentorFeedbackHistory
                feedbacks={feedbacks}
                reviewQueue={reviewQueue}
                onSelectStudent={handleSelectStudent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
    </div>
  );
}
