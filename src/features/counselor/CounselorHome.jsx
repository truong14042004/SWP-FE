import '../../styles/member.css';

export function CounselorHome({ session, onSignOut }) {
  return (
    <main className="member-shell">
      <section className="member-card">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <p className="eyebrow">{session.user.role}</p>
        <h1>Counselor Workspace</h1>
        <p>Xem danh sách sinh viên, skill gap, roadmap và gửi feedback học thuật.</p>
        <div className="role-action-grid">
          <span>Assigned students</span>
          <span>Skill gaps</span>
          <span>Roadmaps</span>
          <span>Feedback</span>
        </div>
        <button type="button" className="primary-action" onClick={onSignOut}>
          Đăng xuất
        </button>
      </section>
    </main>
  );
}

