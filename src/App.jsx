import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { CounselorHome } from './features/counselor/CounselorHome';
import { HomePage } from './features/home/HomePage';
import { MentorHome } from './features/mentor/MentorHome';
import { PaymentResultPage } from './features/subscriptions/PaymentResultPage';
import { PublicPortfolioPage } from './features/portfolio/PublicPortfolioPage';
import { MarketPulsePage } from './features/market/MarketPulsePage';
import { UnsupportedRoleHome } from './features/member/UnsupportedRoleHome';
import { StudentDashboard } from './features/student/StudentDashboard';
import { normalizeRole, userRoles } from './auth/roles';
import { clearSession, getSessionRole, getStoredSession } from './auth/session';

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [authIntent, setAuthIntent] = useState(null); // null | 'login' | 'register'
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
    setAuthIntent(null);
    navigateTo('/');
  }

  function handleAuthenticated(nextSession) {
    setSession(nextSession);
    setAuthIntent(null);
  }

  // Public portfolio route: /portfolio/{slug}
  // Doesn't require authentication and isn't gated by role.
  const portfolioMatch = currentPath.match(/^\/portfolio\/([^/]+)\/?$/);
  if (portfolioMatch) {
    return (
      <PublicPortfolioPage
        slug={decodeURIComponent(portfolioMatch[1])}
        onHome={() => navigateTo('/')}
      />
    );
  }

  if (currentPath === '/market-pulse') {
    return <MarketPulsePage />;
  }

  if (currentPath === '/payment/success') {
    return (
      <PaymentResultPage
        type="success"
        session={session}
        onLogin={() => {
          navigateTo('/');
          setAuthIntent('login');
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
          setAuthIntent('login');
        }}
        onHome={() => navigateTo('/')}
      />
    );
  }

  if (!session) {
    return authIntent
      ? (
        <AuthPage
          initialMode={authIntent}
          onAuthenticated={handleAuthenticated}
          onBackHome={() => setAuthIntent(null)}
        />
      )
      : (
        <HomePage
          onLogin={() => setAuthIntent('login')}
          onStart={() => setAuthIntent('register')}
        />
      );
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
        onLogin={() => setAuthIntent('login')}
        onStart={() => setAuthIntent('register')}
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

