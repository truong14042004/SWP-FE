import { useEffect, useMemo, useState } from 'react';
import { apiUrl, googleClientId } from '../../config';
import { apiRequest } from '../../api/http';
import { persistSession } from '../../auth/session';

const initialLoginForm = { username: '', password: '' };
const initialRegisterForm = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
};
const initialOtpForm = { email: '', otp: '' };

export function AuthPage({ onAuthenticated, onBackHome }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [otpForm, setOtpForm] = useState(initialOtpForm);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const activeForm = mode === 'login' ? loginForm : registerForm;
  const isGoogleConfigured = Boolean(apiUrl && googleClientId);
  const submitLabel = useMemo(() => {
    if (status === 'loading') {
      return mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...';
    }

    return mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
  }, [mode, status]);

  useEffect(() => {
    if (!isGoogleConfigured) {
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
        shape: 'pill',
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
    return () => script.removeEventListener('load', renderGoogleButton);
  }, [isGoogleConfigured, pendingVerificationEmail, mode]);

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
    setStatus('loading');
    setMessage('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      if (mode === 'register' && activeForm.password !== activeForm.confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }

      const payload = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(activeForm),
      });

      if (mode === 'register') {
        setPendingVerificationEmail(payload.email);
        setOtpForm({ email: payload.email, otp: '' });
        setStatus('success');
        setMessage(payload.message || 'Mã OTP đã được gửi đến email của bạn.');
        return;
      }

      persistSession(payload);
      onAuthenticated(payload);
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
    setStatus('loading');
    setMessage('');

    try {
      const payload = await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(otpForm),
      });
      persistSession(payload);
      onAuthenticated(payload);
      setStatus('success');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  async function handleGoogleCredential(response) {
    setStatus('loading');
    setMessage('');

    try {
      const payload = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential }),
      });
      persistSession(payload);
      onAuthenticated(payload);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="intro-panel" aria-label="CareerMap">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <h1>Đăng nhập CareerMap</h1>
        <p>Một trang đăng nhập chung. Sau khi xác thực, hệ thống tự mở dashboard đúng theo role của tài khoản.</p>
        <div className="signal-grid" aria-hidden="true">
          <span>Student</span>
          <span>Admin</span>
          <span>Mentor</span>
        </div>
      </section>

      <section className="auth-panel" aria-label="Đăng nhập CareerMap">
        {onBackHome && (
          <button type="button" className="back-home-button" onClick={onBackHome}>
            ← Trang chủ
          </button>
        )}
        <div className="auth-header">
          <p className="eyebrow">CareerMap Console</p>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Chọn chế độ">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Đăng nhập</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Đăng ký</button>
        </div>

        {pendingVerificationEmail ? (
          <form className="auth-form" onSubmit={submitOtp}>
            <label><span>Email nhận OTP</span><input name="email" value={otpForm.email} onChange={updateOtpField} autoComplete="email" readOnly required /></label>
            <label><span>Mã OTP</span><input name="otp" value={otpForm.otp} onChange={updateOtpField} inputMode="numeric" minLength={6} maxLength={6} autoComplete="one-time-code" required /></label>
            <button className="primary-action" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Đang xác nhận...' : 'Xác nhận OTP'}</button>
            <button className="secondary-action" type="button" onClick={() => switchMode('register')}>Nhập lại thông tin</button>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={submitAuth}>
              <label><span>Tên đăng nhập</span><input name="username" value={activeForm.username} onChange={mode === 'login' ? updateLoginField : updateRegisterField} minLength={3} maxLength={100} autoComplete="username" required /></label>
              {mode === 'register' && (
                <>
                  <label><span>Email</span><input type="email" name="email" value={registerForm.email} onChange={updateRegisterField} maxLength={256} autoComplete="email" required /></label>
                  <label><span>Họ và tên</span><input name="fullName" value={registerForm.fullName} onChange={updateRegisterField} maxLength={200} autoComplete="name" required /></label>
                </>
              )}
              <label><span>Mật khẩu</span><input type="password" name="password" value={activeForm.password} onChange={mode === 'login' ? updateLoginField : updateRegisterField} minLength={6} maxLength={100} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
              {mode === 'register' && <label><span>Xác nhận mật khẩu</span><input type="password" name="confirmPassword" value={registerForm.confirmPassword} onChange={updateRegisterField} minLength={6} maxLength={100} autoComplete="new-password" required /></label>}
              <button className="primary-action" type="submit" disabled={status === 'loading'}>{submitLabel}</button>
            </form>
            {isGoogleConfigured && <><div className="divider"><span>hoặc</span></div><div className="google-area"><div id="googleSignInButton" /></div></>}
          </>
        )}

        {status === 'success' && message && <div className="success">{message}</div>}
        {status === 'error' && <div className="alert">{message}</div>}
      </section>
    </main>
  );
}
