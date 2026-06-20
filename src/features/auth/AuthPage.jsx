import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl, googleClientId } from '../../config';
import { apiRequest } from '../../api/http';
import { persistSession } from '../../auth/session';
import '../../styles/auth.css';

const INIT_LOGIN    = { username: '', password: '' };
const INIT_REGISTER = { username: '', email: '', fullName: '', password: '', confirmPassword: '' };
const OTP_LENGTH    = 6;
const USERNAME_RE   = /^[a-zA-Z0-9._-]{3,32}$/;
const EMAIL_RE      = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@gmail\.com$/i;

/* ────────────────────────────────────────────────────────────
   Inline icons — small SVGs to avoid raster assets.
   ──────────────────────────────────────────────────────────── */
const Icon = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.3 4.4" />
      <path d="M6.7 6.7A17.6 17.6 0 0 0 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.6-1.1" />
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7l8-4 8 4-8 4-8-4Z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 17l8 4 8-4" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  ),
};

/* ────────────────────────────────────────────────────────────
   Password strength estimator (0–4).
   ──────────────────────────────────────────────────────────── */
function scorePassword(value = '') {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

function validateRegisterForm(form) {
  const fullName = form.fullName.trim();
  const username = form.username.trim();
  const email = form.email.trim();
  const password = form.password;

  if (fullName.length < 2) {
    return 'Họ và tên phải có ít nhất 2 ký tự.';
  }
  if (!USERNAME_RE.test(username)) {
    return 'Tên đăng nhập phải dài 3-32 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  }
  if (!EMAIL_RE.test(email)) {
    return 'Email phải là địa chỉ Gmail hợp lệ, ví dụ name@gmail.com.';
  }
  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ cái và 1 chữ số.';
  }
  if (password !== form.confirmPassword) {
    return 'Mật khẩu xác nhận không khớp.';
  }
  return '';
}

const STRENGTH_LABEL = ['Trống', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];

/* ────────────────────────────────────────────────────────────
   AuthPage — login / register / OTP confirmation.
   ──────────────────────────────────────────────────────────── */
export function AuthPage({ onAuthenticated, onBackHome, initialMode = 'login' }) {
  const [mode, setMode]           = useState(initialMode === 'register' ? 'register' : 'login'); // 'login' | 'register' | 'otp'
  const [loginForm, setLoginForm] = useState(INIT_LOGIN);
  const [regForm, setRegForm]     = useState(INIT_REGISTER);
  const [otpEmail, setOtpEmail]   = useState('');
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [showLoginPwd, setShowLoginPwd]     = useState(false);
  const [showRegPwd, setShowRegPwd]         = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [status, setStatus]   = useState('idle');
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const isLoading       = status === 'loading';
  const isGoogleEnabled = Boolean(apiUrl && googleClientId);
  const passwordScore   = useMemo(() => scorePassword(regForm.password), [regForm.password]);

  /* ── Resend countdown ── */
  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const id = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  /* ── Google identity rendering ── */
  useEffect(() => {
    if (!isGoogleEnabled || mode === 'otp') return undefined;

    const render = () => {
      const el = document.getElementById('g-btn');
      if (!el || !window.google?.accounts?.id) return;
      el.replaceChildren();
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogle });
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        width: 360,
        shape: 'pill',
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) { render(); return undefined; }

    let s = document.getElementById('gsi-script');
    if (!s) {
      s = Object.assign(document.createElement('script'), {
        id: 'gsi-script',
        src: 'https://accounts.google.com/gsi/client',
        async: true,
        defer: true,
      });
      document.body.appendChild(s);
    }
    s.addEventListener('load', render);
    return () => s.removeEventListener('load', render);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleEnabled, mode]);

  /* ── Helpers ── */
  function field(setter) {
    return (e) => setter((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setStatus('idle');
    setMessage('');
    if (next !== 'otp') {
      setOtpEmail('');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    }
  }

  /* ── OTP cell handlers ── */
  function handleOtpChange(index, value) {
    const v = value.replace(/\D/g, '').slice(0, 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e) {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  }

  /* ── Auth submit (login + register) ── */
  async function submitAuth(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      if (mode === 'register') {
        const validationError = validateRegisterForm(regForm);
        if (validationError) {
          throw new Error(validationError);
        }
      }
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body     = mode === 'login'
        ? loginForm
        : {
            ...regForm,
            fullName: regForm.fullName.trim(),
            username: regForm.username.trim().toLowerCase(),
            email: regForm.email.trim().toLowerCase(),
          };
      const payload  = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });

      if (mode === 'register') {
        setOtpEmail(payload.email);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setStatus('success');
        setMessage(payload.message || 'Mã xác thực đã được gửi đến email của bạn.');
        setMode('otp');
        setResendTimer(60);
        return;
      }
      persistSession(payload);
      onAuthenticated(payload);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  /* ── OTP submit ── */
  async function submitOtp(e) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) {
      setStatus('error');
      setMessage(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số.`);
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const payload = await apiRequest('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      persistSession(payload);
      onAuthenticated(payload);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  /* ── Resend OTP ── */
  async function resendOtp() {
    if (resendTimer > 0) return;
    setStatus('loading');
    setMessage('');
    try {
      await apiRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail }),
      });
      setResendTimer(60);
      setStatus('success');
      setMessage('Mã xác thực mới đã được gửi.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  /* ── Google sign-in ── */
  async function handleGoogle(res) {
    setStatus('loading');
    setMessage('');
    try {
      const payload = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: res.credential }),
      });
      persistSession(payload);
      onAuthenticated(payload);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  /* ── Status banner ── */
  function StatusBar() {
    if (status === 'error') {
      return (
        <div className="auth-msg auth-msg--err" role="alert">
          <span className="auth-msg-icon">{Icon.warn}</span>
          <span>{message}</span>
        </div>
      );
    }
    if (status === 'success' && message) {
      return (
        <div className="auth-msg auth-msg--ok" role="status">
          <span className="auth-msg-icon">{Icon.check}</span>
          <span>{message}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="auth-page">

      {/* ─────────── LEFT — DARK BRAND PANEL ─────────── */}
      <aside className="auth-brand" aria-label="CareerMap">
        <div className="auth-brand-inner">
          <button type="button" className="auth-back" onClick={onBackHome}>
            ← Trang chủ
          </button>

          <div className="auth-brand-logo">
            <span className="auth-brand-mark">CM</span>
            CareerMap
          </div>

          <div className="auth-brand-copy">
            <h1>
              Lộ trình <em>nghề nghiệp</em><br />
              của bạn — rõ ràng hơn.
            </h1>
            <p>
              Phân tích kỹ năng, sinh lộ trình học, và nhận đánh giá từ mentor đang
              làm việc tại các công ty công nghệ — tất cả ở một nền tảng duy nhất.
            </p>
          </div>

          <ul className="auth-brand-points">
            <li>Skill gap analysis dựa trên dữ liệu thị trường</li>
            <li>Lộ trình cá nhân hoá, cập nhật theo tuần</li>
            <li>Mentor review portfolio trong 48 giờ</li>
          </ul>

          <div className="auth-brand-chips">
            {['Sinh viên', 'Cố vấn', 'Mentor', 'Quản trị'].map((r) => (
              <span key={r} className="auth-chip">
                {r}
              </span>
            ))}
          </div>

          <p className="auth-brand-foot">© {new Date().getFullYear()} CareerMap · Việt Nam</p>
        </div>
      </aside>

      {/* ─────────── RIGHT — FORM PANEL ─────────── */}
      <main className="auth-form-side">
        <div className="auth-form-wrap">

          {/* ============== OTP SCREEN ============== */}
          {mode === 'otp' ? (
            <section className="auth-card" aria-label="Xác thực OTP">
              <header className="auth-card-head">
                <span className="auth-card-eyebrow">Bước cuối cùng</span>
                <h2 className="auth-card-title">Kiểm tra email của bạn</h2>
                <p className="auth-card-sub">
                  Chúng tôi đã gửi mã 6 chữ số tới <strong>{otpEmail}</strong>.
                  Mã có hiệu lực trong 10 phút.
                </p>
              </header>

              <form onSubmit={submitOtp} className="auth-fields">
                <div className="auth-field">
                  <label>Mã xác thực</label>
                  <div className="auth-otp-cells" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        className={digit ? 'filled' : ''}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        autoFocus={i === 0}
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Chữ số ${i + 1}`}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      />
                    ))}
                  </div>
                </div>

                <div className="auth-otp-meta">
                  <span>Không nhận được mã?</span>
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={resendOtp}
                    disabled={resendTimer > 0 || isLoading}
                  >
                    {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
                  </button>
                </div>

                <StatusBar />

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading ? <><span className="auth-spinner" />Đang xác nhận…</> : 'Xác nhận OTP'}
                </button>
              </form>

              <button type="button" className="auth-text-btn" onClick={() => switchMode('register')}>
                ← Nhập lại thông tin đăng ký
              </button>
            </section>
          )

          /* ============== LOGIN / REGISTER ============== */
          : (
            <section className="auth-card" aria-label={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}>
              <header className="auth-card-head">
                <span className="auth-card-eyebrow">
                  {mode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu hành trình'}
                </span>
                <h2 className="auth-card-title">
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </h2>
                <p className="auth-card-sub">
                  {mode === 'login'
                    ? 'Đăng nhập để tiếp tục lộ trình của bạn.'
                    : 'Chỉ vài thông tin để CareerMap đồng hành cùng bạn.'}
                </p>
              </header>

              <div className="auth-toggle" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => switchMode('login')}
                >Đăng nhập</button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => switchMode('register')}
                >Đăng ký</button>
              </div>

              <form onSubmit={submitAuth} className="auth-fields">
                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-fullName">Họ và tên</label>
                    <div className="auth-input with-icon">
                      <input
                        id="reg-fullName"
                        name="fullName"
                        value={regForm.fullName}
                        onChange={field(setRegForm)}
                        placeholder="Nguyễn Văn A"
                        maxLength={200}
                        autoComplete="name"
                        required
                      />
                      <span className="auth-input-icon">{Icon.badge}</span>
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-username">Tên đăng nhập</label>
                  <div className="auth-input with-icon">
                    <input
                      id="auth-username"
                      name="username"
                      value={mode === 'login' ? loginForm.username : regForm.username}
                      onChange={mode === 'login' ? field(setLoginForm) : field(setRegForm)}
                      placeholder="your_username"
                      minLength={3}
                      maxLength={32}
                      pattern="[A-Za-z0-9._\\-]{3,32}"
                      title="Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang."
                      autoComplete="username"
                      required
                    />
                    <span className="auth-input-icon">{Icon.user}</span>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-email">Email</label>
                    <div className="auth-input with-icon">
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        value={regForm.email}
                        onChange={field(setRegForm)}
                        placeholder="you@gmail.com"
                        maxLength={256}
                        pattern="[a-zA-Z0-9]([a-zA-Z0-9._%+\\-]{0,62}[a-zA-Z0-9])?@gmail\.com"
                        title="Chỉ chấp nhận địa chỉ Gmail, ví dụ name@gmail.com."
                        autoComplete="email"
                        required
                      />
                      <span className="auth-input-icon">{Icon.mail}</span>
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-password">Mật khẩu</label>
                  <div className="auth-input with-icon">
                    <input
                      id="auth-password"
                      name="password"
                      type={(mode === 'login' ? showLoginPwd : showRegPwd) ? 'text' : 'password'}
                      value={mode === 'login' ? loginForm.password : regForm.password}
                      onChange={mode === 'login' ? field(setLoginForm) : field(setRegForm)}
                      placeholder="••••••••"
                      minLength={mode === 'login' ? 6 : 8}
                      maxLength={100}
                      pattern={mode === 'register' ? '^(?=.*[A-Za-z])(?=.*\\d).{8,100}$' : undefined}
                      title={mode === 'register' ? 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ cái và chữ số.' : undefined}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                    <span className="auth-input-icon">{Icon.lock}</span>
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() =>
                        mode === 'login'
                          ? setShowLoginPwd((v) => !v)
                          : setShowRegPwd((v) => !v)
                      }
                      aria-label="Hiện / ẩn mật khẩu"
                    >
                      {(mode === 'login' ? showLoginPwd : showRegPwd) ? Icon.eyeOff : Icon.eye}
                    </button>
                  </div>

                  {mode === 'register' && regForm.password && (
                    <>
                      <div className="auth-strength" data-score={passwordScore}>
                        <span className="auth-strength-bar" />
                        <span className="auth-strength-bar" />
                        <span className="auth-strength-bar" />
                        <span className="auth-strength-bar" />
                      </div>
                      <span className="auth-strength-label">
                        Độ mạnh: {STRENGTH_LABEL[passwordScore]}
                      </span>
                    </>
                  )}
                </div>

                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
                    <div className="auth-input with-icon">
                      <input
                        id="reg-confirm"
                        name="confirmPassword"
                        type={showRegConfirm ? 'text' : 'password'}
                        value={regForm.confirmPassword}
                        onChange={field(setRegForm)}
                        placeholder="••••••••"
                        minLength={8}
                        maxLength={100}
                        autoComplete="new-password"
                        required
                      />
                      <span className="auth-input-icon">{Icon.lock}</span>
                      <button
                        type="button"
                        className="auth-input-toggle"
                        onClick={() => setShowRegConfirm((v) => !v)}
                        aria-label="Hiện / ẩn mật khẩu"
                      >
                        {showRegConfirm ? Icon.eyeOff : Icon.eye}
                      </button>
                    </div>
                  </div>
                )}

                <StatusBar />

                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading
                    ? (
                      <>
                        <span className="auth-spinner" />
                        {mode === 'login' ? 'Đang đăng nhập…' : 'Đang tạo tài khoản…'}
                      </>
                    )
                    : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                </button>
              </form>

              {isGoogleEnabled && (
                <>
                  <div className="auth-or"><span>hoặc</span></div>
                  <div className="auth-google"><div id="g-btn" /></div>
                </>
              )}

              <p className="auth-card-foot">
                {mode === 'login' ? (
                  <>Chưa có tài khoản? <button type="button" className="auth-text-btn" onClick={() => switchMode('register')}>Đăng ký ngay</button></>
                ) : (
                  <>Đã có tài khoản? <button type="button" className="auth-text-btn" onClick={() => switchMode('login')}>Đăng nhập</button></>
                )}
              </p>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
