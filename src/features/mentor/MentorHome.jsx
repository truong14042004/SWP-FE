import '../../styles/member.css';

export function MentorHome({ session, onSignOut }) {
  return (
    <main className="member-shell">
      <section className="member-card">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <p className="eyebrow">{session.user.role}</p>
        <h1>Mentor Workspace</h1>
        <p>Review portfolio, GitHub projects và đánh giá mức độ sẵn sàng đi làm của sinh viên.</p>
        <div className="role-action-grid">
          <span>Review queue</span>
          <span>Portfolios</span>
          <span>GitHub review</span>
          <span>Mentor feedback</span>
        </div>
        <button type="button" className="primary-action" onClick={onSignOut}>
          Đăng xuất
        </button>
      </section>
    </main>
  );
}

