import { useEffect, useMemo, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const storageKey = 'careermap.auth';

function getStoredSession() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isConfigured = useMemo(
    () => Boolean(apiUrl && googleClientId),
    [],
  );

  useEffect(() => {
    if (!isConfigured || session) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with',
          shape: 'rectangular',
        },
      );
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isConfigured, session]);

  async function handleGoogleCredential(response) {
    setStatus('loading');
    setMessage('');

    try {
      const result = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const payload = await result.json();
      if (!result.ok) {
        throw new Error(payload.message || 'Google login failed.');
      }

      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSession(payload);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  function signOut() {
    localStorage.removeItem(storageKey);
    setSession(null);
    setStatus('idle');
    setMessage('');
  }

  return (
    <main className="app-shell">
      <section className="auth-panel">
        <div className="brand-mark">CM</div>
        <p className="eyebrow">CareerMap</p>
        <h1>Sign in to continue</h1>
        <p className="description">
          Use your Google account to access the CareerMap workspace.
        </p>

        {!isConfigured && (
          <div className="alert">
            Missing frontend environment variables. Set VITE_API_URL and
            VITE_GOOGLE_CLIENT_ID.
          </div>
        )}

        {session ? (
          <div className="profile-card">
            {session.user.avatarUrl ? (
              <img src={session.user.avatarUrl} alt="" className="avatar" />
            ) : (
              <div className="avatar fallback">
                {session.user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <strong>{session.user.fullName}</strong>
              <span>{session.user.email}</span>
            </div>
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="login-area">
            <div id="googleSignInButton" />
            {status === 'loading' && <p className="helper">Signing in...</p>}
          </div>
        )}

        {status === 'error' && <div className="alert">{message}</div>}

        <dl className="config-list">
          <div>
            <dt>API</dt>
            <dd>{apiUrl || 'Not configured'}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
