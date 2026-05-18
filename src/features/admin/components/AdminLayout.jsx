export const adminSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'payments', label: 'Payments' },
  { id: 'plans', label: 'Plans' },
  { id: 'skills', label: 'Skills' },
  { id: 'resources', label: 'Resources' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'careerRoles', label: 'Career Roles' },
];

export function AdminLayout({ session, activeSection, onSectionChange, onRefresh, onSignOut, children }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark">CM</span>
          <div><strong>CareerMap</strong><span>Admin Console</span></div>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {adminSections.map((section) => (
            <button key={section.id} type="button" className={activeSection === section.id ? 'active' : ''} onClick={() => onSectionChange(section.id)}>
              {section.label}
            </button>
          ))}
        </nav>
        <div className="admin-account">
          <span>{session.user.fullName}</span>
          <small>{session.user.email}</small>
          <button type="button" onClick={onSignOut}>Đăng xuất</button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div><p className="eyebrow">System control</p><h1>Admin Dashboard</h1></div>
          <button type="button" className="pill-button" onClick={onRefresh}>Làm mới</button>
        </header>
        {children}
      </section>
    </main>
  );
}
