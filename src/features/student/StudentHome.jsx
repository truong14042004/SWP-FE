export function StudentHome({ session, onSignOut }) {
  return (
    <RoleHome
      session={session}
      onSignOut={onSignOut}
      title="Student Workspace"
      description="Xem roadmap, tài nguyên học tập, portfolio và lượt mentor review của bạn."
      actions={['Roadmap', 'Learning resources', 'Portfolio', 'Mentor reviews']}
    />
  );
}

function RoleHome({ session, onSignOut, title, description, actions }) {
  return (
    <main className="member-shell">
      <section className="member-card">
        <div className="brand-row">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <p className="eyebrow">{session.user.role}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="role-action-grid">
          {actions.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
        <button type="button" className="primary-action" onClick={onSignOut}>
          Đăng xuất
        </button>
      </section>
    </main>
  );
}

