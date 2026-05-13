import { useEffect, useMemo, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const storageKey = 'careermap.auth';
const initialLoginForm = {
  username: '',
  password: '',
};
const initialRegisterForm = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
};
const initialOtpForm = {
  email: '',
  otp: '',
};

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
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [otpForm, setOtpForm] = useState(initialOtpForm);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const activeForm = mode === 'login' ? loginForm : registerForm;
  const isGoogleConfigured = Boolean(apiUrl && googleClientId);
  const submitLabel = useMemo(
    () => {
      if (status === 'loading') {
        return mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...';
      }

      return mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
    },
    [mode, status],
  );

  useEffect(() => {
    if (!isGoogleConfigured || session) {
      return;
    }

    const renderGoogleButton = () => {
      const container = document.getElementById('googleSignInButton');
      if (!container || !window.google?.accounts?.id) {
        return;
      }

      container.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    let script = document.getElementById('googleIdentityScript');
    if (!script) {
      script = document.createElement('script');
      script.id = 'googleIdentityScript';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.addEventListener('load', renderGoogleButton);

    return () => {
      script.removeEventListener('load', renderGoogleButton);
    };
  }, [isGoogleConfigured, session, pendingVerificationEmail, mode]);

  function updateLoginField(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  function updateRegisterField(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  }

  function updateOtpField(event) {
    const { name, value } = event.target;
    setOtpForm((current) => ({ ...current, [name]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setPendingVerificationEmail('');
    setOtpForm(initialOtpForm);
    setStatus('idle');
    setMessage('');
  }

  async function submitAuth(event) {
    event.preventDefault();

    if (!apiUrl) {
      setStatus('error');
      setMessage('Thiếu cấu hình VITE_API_URL.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      if (mode === 'register' && activeForm.password !== activeForm.confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }

      const payload = await requestAuth(endpoint, activeForm);

      if (mode === 'register') {
        setPendingVerificationEmail(payload.email);
        setOtpForm({ email: payload.email, otp: '' });
        setStatus('success');
        setMessage(payload.message || 'Mã OTP đã được gửi đến email của bạn.');
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSession(payload);
      setStatus('success');
      setLoginForm(initialLoginForm);
      setRegisterForm(initialRegisterForm);
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function submitOtp(event) {
    event.preventDefault();

    if (!apiUrl) {
      setStatus('error');
      setMessage('Thiếu cấu hình VITE_API_URL.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const payload = await requestAuth('/api/auth/verify-email', otpForm);

      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSession(payload);
      setStatus('success');
      setMessage('');
      setRegisterForm(initialRegisterForm);
      setOtpForm(initialOtpForm);
      setPendingVerificationEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function handleGoogleCredential(response) {
    if (!apiUrl) {
      setStatus('error');
      setMessage('Thiếu cấu hình VITE_API_URL.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const payload = await requestAuth('/api/auth/google', {
        idToken: response.credential,
      });

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
      <section className="intro-panel" aria-label="CareerMap">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <h1>Vào workspace định hướng nghề nghiệp</h1>
        <p>
          Quản lý lộ trình học tập, hồ sơ ứng tuyển và kế hoạch phát triển bằng
          một tài khoản CareerMap duy nhất.
        </p>
        <div className="signal-grid" aria-hidden="true">
          <span>Lộ trình</span>
          <span>Kỹ năng</span>
          <span>Mục tiêu</span>
        </div>
      </section>

      <section className="auth-panel" aria-label="Đăng nhập CareerMap">
        <div className="auth-header">
          <p className="eyebrow">Tài khoản CareerMap</p>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
        </div>

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
              Đăng xuất
            </button>
          </div>
        ) : (
          <>
            <div className="mode-switch" role="tablist" aria-label="Chọn chế độ">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
              >
                Đăng ký
              </button>
            </div>

            {pendingVerificationEmail ? (
              <form className="auth-form" onSubmit={submitOtp}>
                <label>
                  <span>Email nhận OTP</span>
                  <input
                    name="email"
                    value={otpForm.email}
                    onChange={updateOtpField}
                    autoComplete="email"
                    readOnly
                    required
                  />
                </label>

                <label>
                  <span>Mã OTP</span>
                  <input
                    name="otp"
                    value={otpForm.otp}
                    onChange={updateOtpField}
                    inputMode="numeric"
                    minLength={6}
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                  />
                </label>

                <button className="primary-action" type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Đang xác nhận...' : 'Xác nhận OTP'}
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => switchMode('register')}
                >
                  Nhập lại thông tin
                </button>
              </form>
            ) : (
              <>
                <form className="auth-form" onSubmit={submitAuth}>
                  <label>
                    <span>Tên đăng nhập</span>
                    <input
                      name="username"
                      value={activeForm.username}
                      onChange={mode === 'login' ? updateLoginField : updateRegisterField}
                      minLength={3}
                      maxLength={100}
                      autoComplete="username"
                      required
                    />
                  </label>

                  {mode === 'register' && (
                    <>
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          name="email"
                          value={registerForm.email}
                          onChange={updateRegisterField}
                          maxLength={256}
                          autoComplete="email"
                          required
                        />
                      </label>

                      <label>
                        <span>Họ và tên</span>
                        <input
                          name="fullName"
                          value={registerForm.fullName}
                          onChange={updateRegisterField}
                          maxLength={200}
                          autoComplete="name"
                          required
                        />
                      </label>
                    </>
                  )}

                  <label>
                    <span>Mật khẩu</span>
                    <input
                      type="password"
                      name="password"
                      value={activeForm.password}
                      onChange={mode === 'login' ? updateLoginField : updateRegisterField}
                      minLength={6}
                      maxLength={100}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                  </label>

                  {mode === 'register' && (
                    <label>
                      <span>Xác nhận mật khẩu</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={registerForm.confirmPassword}
                        onChange={updateRegisterField}
                        minLength={6}
                        maxLength={100}
                        autoComplete="new-password"
                        required
                      />
                    </label>
                  )}

                  <button className="primary-action" type="submit" disabled={status === 'loading'}>
                    {submitLabel}
                  </button>
                </form>

                {isGoogleConfigured && (
                  <>
                    <div className="divider">
                      <span>hoặc</span>
                    </div>
                    <div className="google-area">
                      <div id="googleSignInButton" />
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {status === 'success' && message && <div className="success">{message}</div>}
        {status === 'error' && <div className="alert">{message}</div>}
      </section>
    </main>
  );
}

async function requestAuth(endpoint, body) {
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
  }

  return payload;
}
