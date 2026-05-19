import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { CounselorHome } from './features/counselor/CounselorHome';
import { HomePage } from './features/home/HomePage';
import { MentorHome } from './features/mentor/MentorHome';
import { PaymentResultPage } from './features/subscriptions/PaymentResultPage';
import { UnsupportedRoleHome } from './features/member/UnsupportedRoleHome';
import { StudentDashboard } from './features/student/StudentDashboard';
import { normalizeRole, userRoles } from './auth/roles';
import { clearSession, getSessionRole, getStoredSession } from './auth/session';

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [showLogin, setShowLogin] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  function navigateTo(path) {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }

  function signOut() {
    clearSession();
    setSession(null);
    setShowLogin(false);
    navigateTo('/');
  }

  function handleAuthenticated(nextSession) {
    setSession(nextSession);
    setShowLogin(false);
  }

  if (currentPath === '/payment/success') {
    return (
      <PaymentResultPage
        type="success"
        session={session}
        onLogin={() => {
          navigateTo('/');
          setShowLogin(true);
        }}
        onHome={() => navigateTo('/')}
      />
    );
  }

  if (currentPath === '/payment/cancel') {
    return (
      <PaymentResultPage
        type="cancel"
        session={session}
        onLogin={() => {
          navigateTo('/');
          setShowLogin(true);
        }}
        onHome={() => navigateTo('/')}
      />
    );
  }

  if (!session) {
    return showLogin
      ? <AuthPage onAuthenticated={handleAuthenticated} onBackHome={() => setShowLogin(false)} />
      : <HomePage onLogin={() => setShowLogin(true)} />;
  }

  const role = normalizeRole(getSessionRole(session));

  if (role === normalizeRole(userRoles.admin)) {
    return <AdminDashboard session={session} onSignOut={signOut} />;
  }

  if (role === normalizeRole(userRoles.student)) {
    if (currentPath === '/dashboard') {
      return <StudentDashboard session={session} onSignOut={signOut} onNavigateHome={() => navigateTo('/')} />;
    }

    return (
      <HomePage
        session={session}
        onLogin={() => setShowLogin(true)}
        onSignOut={signOut}
        onOpenDashboard={() => navigateTo('/dashboard')}
      />
    );
  }

  if (role === normalizeRole(userRoles.academicCounselor)) {
    return <CounselorHome session={session} onSignOut={signOut} />;
  }

  if (role === normalizeRole(userRoles.industryMentor)) {
    return <MentorHome session={session} onSignOut={signOut} />;
  }

  return <UnsupportedRoleHome session={session} onSignOut={signOut} />;
}

