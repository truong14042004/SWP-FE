import { useEffect, useMemo, useState } from 'react';
import { apiUrl, googleClientId } from '../../config';
import { apiRequest } from '../../api/http';
import { persistSession } from '../../auth/session';
import '../../styles/auth.css';

const INIT_LOGIN    = { username: '', password: '' };
const INIT_REGISTER = { username: '', email: '', fullName: '', password: '', confirmPassword: '' };
const INIT_OTP      = { email: '', otp: '' };

export function AuthPage({ onAuthenticated, onBackHome }) {
  const [mode, setMode]             = useState('login');   // 'login' | 'register' | 'otp'
  const [loginForm, setLoginForm]   = useState(INIT_LOGIN);
  const [regForm,   setRegForm]     = useState(INIT_REGISTER);
  const [otpForm,   setOtpForm]     = useState(INIT_OTP);
  const [status, setStatus]         = useState('idle');
  const [message, setMessage]       = useState('');

  const isLoading        = status === 'loading';
  const isGoogleEnabled  = Boolean(apiUrl && googleClientId);

  /* ── Google button ── */
  useEffect(() => {
    if (!isGoogleEnabled || mode === 'otp') return;
    const render = () => {
      const el = document.getElementById('g-btn');
      if (!el || !window.google?.accounts?.id) return;
      el.replaceChildren();
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogle });
      window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 320, shape: 'pill' });
    };
    if (window.google?.accounts?.id) { render(); return; }
    let s = document.getElementById('gsi-script');
    if (!s) {
      s = Object.assign(document.createElement('script'), {
        id: 'gsi-script', src: 'https://accounts.google.com/gsi/client', async: true, defer: true,
      });
      document.body.appendChild(s);
    }
    s.addEventListener('load', render);
    return () => s.removeEventListener('load', render);
  }, [isGoogleEnabled, mode]);

  function field(setter) {
    return (e) => setter((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next); setStatus('idle'); setMessage('');
    if (next !== 'otp') { setOtpForm(INIT_OTP); }
  }

  async function submitAuth(e) {
    e.preventDefault(); setStatus('loading'); setMessage('');
    try {
      if (mode === 'register' && regForm.password !== regForm.confirmPassword)
        throw new Error('Mật khẩu xác nhận không khớp.');
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? loginForm : regForm;
      const payload = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
      if (mode === 'register') {
        setOtpForm({ email: payload.email, otp: '' });
        setStatus('success');
        setMessage(payload.message || 'Mã OTP đã được gửi đến email của bạn.');
        setMode('otp');
        return;
      }
      persistSession(payload); onAuthenticated(payload);
    } catch (err) { setStatus('error'); setMessage(err.message); }
  }

  async function submitOtp(e) {
    e.preventDefault(); setStatus('loading'); setMessage('');
    try {
      const payload = await apiRequest('/api/auth/verify-email', { method: 'POST', body: JSON.stringify(otpForm) });
      persistSession(payload); onAuthenticated(payload);
    } catch (err) { setStatus('error'); setMessage(err.message); }
  }

  async function handleGoogle(res) {
    setStatus('loading'); setMessage('');
    try {
      const payload = await apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken: res.credential }) });
      persistSession(payload); onAuthenticated(payload);
    } catch (err) { setStatus('error'); setMessage(err.message); }
  }

  /* ── Shared status bar ── */
  const StatusBar = () => (
    <>
      {status === 'error'   && <div className="auth-msg auth-msg--err">{message}</div>}
      {status === 'success' && message && <div className="auth-msg auth-msg--ok">{message}</div>}
    </>
  );

  return (
    <div className="auth-page">

      {/* Left — brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <button className="auth-back" onClick={onBackHome}>← Trang chủ</button>
          <div className="auth-brand-logo">
            <span className="hp-logo-mark">CM</span>
            <span>CareerMap</span>
          </div>
          <div className="auth-brand-copy">
            <h1>Lộ trình nghề<br />nghiệp của bạn,<br />rõ ràng hơn.</h1>
            <p>
              Từ phân tích skill gap đến mentor review — CareerMap xây dựng
              lộ trình cá nhân hoá đến đúng mục tiêu của bạn.
            </p>
          </div>
          <div className="auth-brand-chips">
            {['Student', 'Counselor', 'Mentor', 'Admin'].map((r) => (
              <span key={r} className="auth-chip">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="auth-form-side">
        <div className="auth-form-wrap">

          {/* ── OTP screen ── */}
          {mode === 'otp' ? (
            <div className="auth-card">
              <div className="auth-card-icon">📬</div>
              <h2 className="auth-card-title">Kiểm tra email của bạn</h2>
              <p className="auth-card-sub">
                Chúng tôi đã gửi mã 6 chữ số tới <strong>{otpForm.email}</strong>
              </p>
              <form onSubmit={submitOtp} className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="otp-email">Email</label>
                  <input
                    id="otp-email"
                    name="email"
                    type="email"
                    value={otpForm.email}
                    onChange={field(setOtpForm)}
                    readOnly
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="otp-code">Mã OTP (6 chữ số)</label>
                  <input
                    id="otp-code"
                    name="otp"
                    className="auth-otp"
                    value={otpForm.otp}
                    onChange={field(setOtpForm)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                  />
                </div>
                <StatusBar />
                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? 'Đang xác nhận…' : 'Xác nhận OTP'}
                </button>
              </form>
              <button className="auth-text-btn" onClick={() => switchMode('register')}>
                ← Nhập lại thông tin đăng ký
              </button>
            </div>

          /* ── Login / Register screen ── */
          ) : (
            <div className="auth-card">
              <h2 className="auth-card-title">
                {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </h2>
              <p className="auth-card-sub">
                {mode === 'login'
                  ? 'Chào mừng trở lại. Đăng nhập để tiếp tục.'
                  : 'Tham gia CareerMap và bắt đầu lộ trình của bạn.'}
              </p>

              {/* Mode toggle */}
              <div className="auth-toggle" role="tablist">
                <button
                  role="tab"
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => switchMode('login')}
                >Đăng nhập</button>
                <button
                  role="tab"
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => switchMode('register')}
                >Đăng ký</button>
              </div>

              <form onSubmit={submitAuth} className="auth-fields">
                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-fullName">Họ và tên</label>
                    <input id="reg-fullName" name="fullName" value={regForm.fullName}
                      onChange={field(setRegForm)} placeholder="Nguyễn Văn A"
                      maxLength={200} autoComplete="name" required />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-username">Tên đăng nhập</label>
                  <input id="auth-username" name="username"
                    value={mode === 'login' ? loginForm.username : regForm.username}
                    onChange={mode === 'login' ? field(setLoginForm) : field(setRegForm)}
                    placeholder="your_username"
                    minLength={3} maxLength={100} autoComplete="username" required />
                </div>

                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-email">Email</label>
                    <input id="reg-email" name="email" type="email" value={regForm.email}
                      onChange={field(setRegForm)} placeholder="you@example.com"
                      maxLength={256} autoComplete="email" required />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-password">Mật khẩu</label>
                  <input id="auth-password" name="password" type="password"
                    value={mode === 'login' ? loginForm.password : regForm.password}
                    onChange={mode === 'login' ? field(setLoginForm) : field(setRegForm)}
                    placeholder="••••••••"
                    minLength={6} maxLength={100}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required />
                </div>

                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
                    <input id="reg-confirm" name="confirmPassword" type="password"
                      value={regForm.confirmPassword} onChange={field(setRegForm)}
                      placeholder="••••••••"
                      minLength={6} maxLength={100} autoComplete="new-password" required />
                  </div>
                )}

                <StatusBar />

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading
                    ? (mode === 'login' ? 'Đang đăng nhập…' : 'Đang tạo tài khoản…')
                    : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                </button>
              </form>

              {isGoogleEnabled && (
                <>
                  <div className="auth-or"><span>hoặc</span></div>
                  <div className="auth-google"><div id="g-btn" /></div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
