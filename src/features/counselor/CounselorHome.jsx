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
                  className={`counselor-subnav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.id)}
                >
                  {item.label}
                  {badge != null && (
                    <span className="counselor-subnav-badge">{badge}</span>
                  )}
                </button>
              );
            })}
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
        {currentView === 'overview' && !selectedStudentId && (
          <CounselorOverview
            students={students}
            feedbacks={feedbacks}
            loading={loading}
            counselorName={counselorName}
            onNavigateToStudents={() => handleNavigate('students')}
            onNavigateToStudent={(id) => handleNavigate('students', id)}
            onNavigateToFeedback={() => handleNavigate('feedback')}
          />
        )}

        {currentView === 'students' && !selectedStudentId && (
          <CounselorStudentList
            students={students}
            loading={loading}
            onSelectStudent={(id) => handleNavigate('students', id)}
            onOpenFeedbackModal={handleOpenFeedbackModal}
          />
        )}

        {currentView === 'students' && selectedStudentId && (
          <CounselorStudentDetail
            session={session}
            studentId={selectedStudentId}
            students={students}
            onBack={handleBack}
            onOpenFeedbackModal={handleOpenFeedbackModal}
          />
        )}

        {currentView === 'roadmap-reviews' && (
          <RoadmapReviewQueue session={session} role="AcademicCounselor" />
        )}

        {currentView === 'feedback' && !selectedStudentId && (
          <CounselorFeedbackHistory
            feedbacks={feedbacks}
            students={students}
            onSelectStudent={(id) => handleNavigate('students', id)}
          />
        )}
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
