import { useEffect, useState } from 'react';
import '../../styles/counselor.css';
import { CounselorOverview } from './components/CounselorOverview';
import { CounselorStudentList } from './components/CounselorStudentList';
import { CounselorStudentDetail } from './components/CounselorStudentDetail';
import { CounselorFeedbackHistory } from './components/CounselorFeedbackHistory';
import { CounselorWriteFeedbackModal } from './components/CounselorWriteFeedbackModal';
import {
  getCounselorStudents,
  getMyFeedbacks,
  createFeedback,
} from './api/counselorApi';

const NAV_ITEMS = [
  { id: 'overview', label: 'Tá»•ng quan' },
  { id: 'students', label: 'Sinh viĂªn' },
  { id: 'feedback', label: 'Lá»‹ch sá»­ feedback' },
];

const VIEW_TITLE = {
  overview: 'Counselor',
  students: 'Counselor',
  feedback: 'Counselor',
};

export function CounselorHome({ session, onSignOut }) {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalStudent, setFeedbackModalStudent] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [studentsData, feedbacksData] = await Promise.all([
        getCounselorStudents(session).catch(() => []),
        getMyFeedbacks(session).catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
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
        error: error?.message || 'KhĂ´ng thá»ƒ gá»­i feedback',
      };
    }
  }

  const counselorName = session?.user?.fullName || 'Counselor';

  return (
    <div className="counselor-shell">
      {/* Global nav (black 44px) */}
      <header className="counselor-globalnav">
        <div className="counselor-globalnav-inner">
          <span className="counselor-globalnav-brand">
            <strong>CareerMap</strong>
          </span>
          <span className="counselor-globalnav-spacer" />
          <span className="counselor-globalnav-meta">
            ÄÄƒng nháº­p:<strong>{counselorName}</strong>
          </span>
          <button
            type="button"
            className="counselor-globalnav-action"
            onClick={onSignOut}
          >
            ÄÄƒng xuáº¥t
          </button>
        </div>
      </header>

      {/* Sub-nav frosted (parchment 80% blur) */}
      <nav className="counselor-subnav" aria-label="Counselor sections">
        <div className="counselor-subnav-inner">
          <span className="counselor-subnav-title">
            {VIEW_TITLE[currentView] || 'Counselor'}
          </span>
          <div className="counselor-subnav-links">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`counselor-subnav-link ${
                  currentView === item.id && !selectedStudentId ? 'active' : ''
                }`}
                onClick={() => handleNavigate(item.id)}
              >
                {item.label}
                {item.id === 'students' && students.length > 0 && (
                  <span className="counselor-subnav-badge">
                    {students.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {currentView === 'students' && !selectedStudentId && (
            <button
              type="button"
              className="counselor-subnav-cta"
              onClick={() => handleNavigate('feedback')}
            >
              Xem feedback â†’
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
