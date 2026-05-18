export function UnsupportedRoleHome({ session, onSignOut }) {
  return (
    <main className="member-shell">
      <section className="member-card">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <p className="eyebrow">Unknown role</p>
        <h1>Role chưa được hỗ trợ</h1>
        <p>Tài khoản {session.user.email} đang có role {session.user.role || 'không xác định'}.</p>
        <button type="button" className="primary-action" onClick={onSignOut}>
          Đăng xuất
        </button>
      </section>
    </main>
  );
}

