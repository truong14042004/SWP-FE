import { useEffect, useState } from 'react';
import '../../styles/counselor.css';
import { CounselorOverview } from './components/CounselorOverview';
import { CounselorStudentList } from './components/CounselorStudentList';
import { CounselorStudentDetail } from './components/CounselorStudentDetail';
import { CounselorFeedbackHistory } from './components/CounselorFeedbackHistory';
import { CounselorWriteFeedbackModal } from './components/CounselorWriteFeedbackModal';
import { getCounselorStudents, getMyFeedbacks, createFeedback } from './api/counselorApi';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C';
}

export function CounselorHome({ session, onSignOut }) {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalStudent, setFeedbackModalStudent] = useState(null);

  const initials = getInitials(session?.user?.fullName);

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
      setStudents(studentsData);
      setFeedbacks(feedbacksData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(view, studentId = null) {
    setCurrentView(view);
    setSelectedStudentId(studentId);
    window.history.pushState({}, '', studentId ? `/counselor/${view}/${studentId}` : `/counselor/${view}`);
  }

  function handleBack() {
    if (selectedStudentId) {
      setSelectedStudentId(null);
      setCurrentView('students');
      window.history.pushState({}, '', '/counselor/students');
    }
  }

  function handleOpenFeedbackModal(student) {
    setFeedbackModalStudent(student);
    setShowFeedbackModal(true);
  }

  async function handleSubmitFeedback(formData) {
    try {
      await createFeedback(session, formData);
      const updatedFeedbacks = await getMyFeedbacks(session).catch(() => []);
      setFeedbacks(updatedFeedbacks);
      setShowFeedbackModal(false);
      setFeedbackModalStudent(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Không thể gửi feedback' };
    }
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: '📊' },
    { id: 'students', label: 'Sinh viên của tôi', icon: '👥' },
    { id: 'feedback', label: 'Lịch sử feedback', icon: '💬' },
  ];

  return (
    <main className="counselor-shell">
      <aside className="counselor-sidebar">
        <div className="counselor-brand">
          <span className="counselor-brand-mark">CC</span>
          <div className="counselor-brand-text">
            <strong>Career Counsel</strong>
            <span>Academic Counselor</span>
          </div>
        </div>

        <nav className="counselor-nav" aria-label="Counselor navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`counselor-nav-item ${currentView === item.id && !selectedStudentId ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="counselor-nav-icon">{item.icon}</span>
              <span className="counselor-nav-label">{item.label}</span>
              {item.id === 'students' && students.length > 0 && (
                <span className="counselor-nav-badge">{students.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="counselor-sidebar-footer">
          <div className="counselor-account">
            <div className="counselor-account-avatar">{initials}</div>
            <div className="counselor-account-info">
              <strong>{session?.user?.fullName}</strong>
              <small>{session?.user?.email}</small>
            </div>
          </div>
          <button type="button" className="counselor-signout-btn" onClick={onSignOut}>
            <span>⏏</span> Đăng xuất
          </button>
        </div>
      </aside>

      <section className="counselor-main">
        {currentView === 'overview' && !selectedStudentId && (
          <CounselorOverview
            students={students}
            feedbacks={feedbacks}
            loading={loading}
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
            onRefresh={loadInitialData}
          />
        )}

        {currentView === 'students' && selectedStudentId && (
          <CounselorStudentDetail
            session={session}
            studentId={selectedStudentId}
            students={students}
            onBack={handleBack}
            onOpenFeedbackModal={handleOpenFeedbackModal}
            onRefreshFeedbacks={loadInitialData}
          />
        )}

        {currentView === 'feedback' && !selectedStudentId && (
          <CounselorFeedbackHistory
            feedbacks={feedbacks}
            students={students}
            onSelectStudent={(id) => handleNavigate('students', id)}
            onRefresh={loadInitialData}
          />
        )}
      </section>

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
    </main>
  );
}
