const NAV_ICONS = {
  overview: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor"/>
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor"/>
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor"/>
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor"/>
    </svg>
  ),
  users: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="6" r="3" fill="currentColor"/>
      <path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="5.5" r="2" fill="currentColor" opacity="0.6"/>
      <path d="M12 13c0-2.21 1.343-4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  payments: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 7.5h16" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5" cy="11" r="1" fill="currentColor"/>
    </svg>
  ),
  plans: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 9h8M5 6h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  skills: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2L11 7H16L12 10.5L13.5 16L9 13L4.5 16L6 10.5L2 7H7L9 2Z" fill="currentColor"/>
    </svg>
  ),
  resources: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  requirements: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5h12M3 9h8M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="13" r="2.5" fill="currentColor"/>
    </svg>
  ),
  careerRoles: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="1" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="12" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 6v3M9 9H3.5v3M9 9h5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

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

const SECTION_LABELS = {
  overview: 'Overview',
  users: 'User Management',
  payments: 'Payments',
  plans: 'Subscription Plans',
  skills: 'Skills',
  resources: 'Learning Resources',
  requirements: 'Role Requirements',
  careerRoles: 'Career Roles',
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'A';
}

export function AdminLayout({ session, activeSection, onSectionChange, onRefresh, onSignOut, children }) {
  const initials = getInitials(session?.user?.fullName);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="admin-brand">
          <span className="brand-mark">CM</span>
          <div>
            <strong>CareerMap</strong>
            <span>Admin Console</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav" aria-label="Admin sections">
          {adminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => onSectionChange(section.id)}
            >
              {NAV_ICONS[section.id]}
              {section.label}
            </button>
          ))}
        </nav>

        {/* Account */}
        <div className="admin-account">
          <div className="admin-account-info">
            <span className="admin-account-avatar">{initials}</span>
            <div>
              <strong>{session?.user?.fullName}</strong>
              <small>{session?.user?.email}</small>
            </div>
          </div>
          <button type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <h1>{SECTION_LABELS[activeSection] || 'Admin Dashboard'}</h1>
          <button type="button" className="pill-button" onClick={onRefresh}>↻ Refresh</button>
        </header>
        {children}
      </section>
    </main>
  );
}
