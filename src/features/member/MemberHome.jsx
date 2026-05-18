export function MemberHome({ session, onSignOut }) {
  return (
    <main className="member-shell">
      <section className="member-card">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <h1>Xin chào, {session.user.fullName}</h1>
        <p>Tài khoản hiện tại là role {session.user.role}. Admin console chỉ mở cho Admin.</p>
        <button type="button" className="primary-action" onClick={onSignOut}>Đăng xuất</button>
      </section>
    </main>
  );
}
