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

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'queue', label: 'Review queue' },
  { id: 'roadmap-reviews', label: 'Roadmap reviews' },
  { id: 'feedback', label: 'Lịch sử feedback' },
];

export function MentorHome({ session, onSignOut }) {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalStudent, setFeedbackModalStudent] = useState(null);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    loadInitialData();
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
                  className={`imentor-subnav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.id)}
                >
                  {item.label}
                  {badge != null && (
                    <span className="imentor-subnav-badge">{badge}</span>
                  )}
                </button>
              );
            })}
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
        {currentView === 'overview' && !selectedStudentId && (
          <MentorOverview
            reviewQueue={reviewQueue}
            feedbacks={feedbacks}
            loading={loading}
            mentorName={mentorName}
            onNavigateToQueue={() => handleNavigate('queue')}
            onNavigateToFeedback={() => handleNavigate('feedback')}
            onSelectStudent={handleSelectStudent}
          />
        )}

        {currentView === 'queue' && !selectedStudentId && (
          <MentorReviewQueue
            reviewQueue={reviewQueue}
            loading={loading}
            onSelectStudent={handleSelectStudent}
            onWriteFeedback={handleOpenFeedbackModal}
          />
        )}

        {currentView === 'queue' && selectedStudentId && (
          <MentorStudentDetail
            session={session}
            studentId={selectedStudentId}
            reviewQueue={reviewQueue}
            onBack={handleBack}
            onWriteFeedback={handleOpenFeedbackModal}
          />
        )}

        {currentView === 'roadmap-reviews' && (
          <RoadmapReviewQueue session={session} role="IndustryMentor" />
        )}

        {currentView === 'feedback' && !selectedStudentId && (
          <MentorFeedbackHistory
            feedbacks={feedbacks}
            reviewQueue={reviewQueue}
            onSelectStudent={handleSelectStudent}
          />
        )}
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
