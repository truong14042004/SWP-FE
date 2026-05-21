import { useEffect, useState } from 'react';
import '../../styles/counselor.css';
import { CounselorOverview } from './components/CounselorOverview';
import { CounselorStudentList } from './components/CounselorStudentList';
import { CounselorStudentDetail } from './components/CounselorStudentDetail';
import { CounselorFeedbackHistory } from './components/CounselorFeedbackHistory';
import { CounselorWriteFeedbackModal } from './components/CounselorWriteFeedbackModal';
import { RoadmapReviewQueue } from '../roadmap-review/RoadmapReviewQueue';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  getCounselorStudents,
  getMyFeedbacks,
  createFeedback,
} from './api/counselorApi';
import { getCounselorRoadmapQueue } from '../roadmap-review/reviewApi';
import { Highlight } from '@/components/animate-ui/primitives/effects/highlight';
import { AnimatePresence, motion } from 'motion/react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'students', label: 'Sinh viên' },
  { id: 'roadmap-reviews', label: 'Roadmap reviews' },
  { id: 'feedback', label: 'Lịch sử feedback' },
];

export function CounselorHome({ session, onSignOut }) {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
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
      const [studentsData, feedbacksData, queueData] = await Promise.all([
        getCounselorStudents(session).catch(() => []),
        getMyFeedbacks(session).catch(() => []),
        getCounselorRoadmapQueue(session).catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
      const pending = (Array.isArray(queueData) ? queueData : [])
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

  return (
    <div className="counselor-shell">
      {/* Global nav — black 44px */}
      <header className="counselor-globalnav">
        <div className="counselor-globalnav-inner">
          <span className="counselor-globalnav-brand">
            <span className="counselor-globalnav-brand-dot" aria-hidden>C</span>
            CareerMap
          </span>
          <span className="counselor-globalnav-spacer" />
          <span className="counselor-globalnav-meta">
            Đăng nhập:<strong>{counselorName}</strong>
          </span>
          <NotificationBell
            session={session}
            onNavigate={(target) => {
              // Map BE link target to counselor view id
              const view = target === 'roadmap-reviews' ? 'roadmap-reviews' : 'overview';
              handleNavigate(view);
            }}
          />
          <button
            type="button"
            className="counselor-globalnav-action"
            onClick={onSignOut}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Sub-nav — frosted parchment 52px */}
      <nav className="counselor-subnav" aria-label="Counselor sections">
        <div className="counselor-subnav-inner">
          <span className="counselor-subnav-title">Counselor</span>
          <div className="counselor-subnav-links">
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
                  item.id === 'students' && students.length > 0
                    ? students.length
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
                    className={`counselor-subnav-link relative z-10 ${isActive ? 'active' : ''}`}
                    style={{ background: 'transparent' }}
                  >
                    {item.label}
                    {badge != null && (
                      <span className="counselor-subnav-badge">{badge}</span>
                    )}
                  </button>
                );
              })}
            </Highlight>
          </div>
          <span className="counselor-subnav-spacer" />
          {currentView === 'students' && !selectedStudentId && (
            <button
              type="button"
              className="counselor-subnav-cta"
              onClick={() => handleNavigate('feedback')}
            >
              Xem feedback
            </button>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="counselor-main">
        <AnimatePresence mode="wait">
          {currentView === 'overview' && !selectedStudentId && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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

          {currentView === 'roadmap-reviews' && (
            <motion.div
              key="roadmap-reviews"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <RoadmapReviewQueue session={session} role="AcademicCounselor" />
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
              <CounselorFeedbackHistory
                feedbacks={feedbacks}
                students={students}
                onSelectStudent={(id) => handleNavigate('students', id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
    </div>
  );
}
