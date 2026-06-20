import '../../styles/member.css';

const ROLE_LABELS = {
  Student: 'Sinh viên',
  Counselor: 'Cố vấn học tập',
  Mentor: 'Mentor',
  Admin: 'Quản trị viên',
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function StudentHome({ session, onSignOut }) {
  return (
    <RoleHome
      session={session}
      onSignOut={onSignOut}
      title="Không gian sinh viên"
      description="Xem lộ trình, tài nguyên học tập, portfolio và lượt mentor review của bạn."
      actions={['Lộ trình', 'Tài nguyên học tập', 'Portfolio', 'Mentor review']}
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
        <p className="eyebrow">{getRoleLabel(session.user.role)}</p>
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

