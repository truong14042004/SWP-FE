import { useEffect, useMemo, useState } from 'react';

const NAV_ICONS = {
  overview: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  ),
  users: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="6" r="3" fill="currentColor" />
      <path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="5.5" r="2" fill="currentColor" opacity="0.6" />
      <path d="M12 13c0-2.21 1.343-4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  assignments: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="6" r="2.5" fill="currentColor" />
      <circle cx="13" cy="6" r="2.5" fill="currentColor" opacity="0.7" />
      <path d="M2 16c0-2.21 1.343-4 3-4s3 1.79 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 16c0-2.21 1.343-4 3-4s3 1.79 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  ),
  payments: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 7.5h16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="11" r="1" fill="currentColor" />
    </svg>
  ),
  plans: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 9h8M5 6h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  skills: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2L11 7H16L12 10.5L13.5 16L9 13L4.5 16L6 10.5L2 7H7L9 2Z" fill="currentColor" />
    </svg>
  ),
  resources: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  requirements: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5h12M3 9h8M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="13" r="2.5" fill="currentColor" />
    </svg>
  ),
  careerRoles: (
    <svg className="nav-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="1" width="6" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6v3M9 9H3.5v3M9 9h5.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * Section ids that live UNDER the Overview parent. Clicking the chevron next
 * to Overview expands/collapses this group. They are still individual sections
 * — the parent only acts as a folder.
 */
const MANAGEMENT_SECTIONS = [
  { id: 'users',        label: 'Users' },
  { id: 'assignments',  label: 'Assignments' },
  { id: 'payments',     label: 'Payments' },
  { id: 'plans',        label: 'Plans' },
  { id: 'skills',       label: 'Skills' },
  { id: 'resources',    label: 'Resources' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'careerRoles',  label: 'Career roles' },
];

const MANAGEMENT_IDS = new Set(MANAGEMENT_SECTIONS.map((s) => s.id));

/**
 * Backwards-compatible flat list. AdminDashboard imports this only for its
 * switch statement; the visual structure is decided here.
 */
export const adminSections = [
  { id: 'overview', label: 'Overview' },
  ...MANAGEMENT_SECTIONS,
];

const SECTION_LABELS = {
  overview:     { title: 'Overview',           sub: 'Platform health at a glance' },
  users:        { title: 'Users',              sub: 'Accounts, roles, and access' },
  assignments:  { title: 'Counselor assignments', sub: 'Match counselors with students' },
  payments:     { title: 'Payments',           sub: 'Transactions, subscriptions, invoices' },
  plans:        { title: 'Subscription plans', sub: 'Pricing and feature limits' },
  skills:       { title: 'Skills',             sub: 'Skill catalog' },
  resources:    { title: 'Learning resources', sub: 'Articles, videos, files' },
  requirements: { title: 'Role requirements',  sub: 'Skills mapped to career roles' },
  careerRoles:  { title: 'Career roles',       sub: 'Target roles students can pursue' },
};

const MGMT_OPEN_STORAGE_KEY = 'admin.sidebar.mgmtOpen';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A';
}

export function AdminLayout({ session, activeSection, onSectionChange, onRefresh, onSignOut, children }) {
  const initials = getInitials(session?.user?.fullName);
  const meta = SECTION_LABELS[activeSection] || SECTION_LABELS.overview;

  const isManagementActive = MANAGEMENT_IDS.has(activeSection);

  // The management group is open when:
  //  (a) the user is currently on one of its children, OR
  //  (b) the user explicitly toggled it open via the chevron.
  // We persist the "explicit" choice so it survives reloads.
  const [mgmtOpen, setMgmtOpen] = useState(() => {
    try {
      const stored = window.localStorage.getItem(MGMT_OPEN_STORAGE_KEY);
      if (stored === '1') return true;
      if (stored === '0') return false;
    } catch { /* ignore */ }
    return isManagementActive; // default: open if a child is active
  });

  // Auto-open when the user navigates into a child section.
  useEffect(() => {
    if (isManagementActive) setMgmtOpen(true);
  }, [isManagementActive]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MGMT_OPEN_STORAGE_KEY, mgmtOpen ? '1' : '0');
    } catch { /* ignore */ }
  }, [mgmtOpen]);

  const showGroup = useMemo(() => mgmtOpen || isManagementActive, [mgmtOpen, isManagementActive]);

  function handleOverviewClick() {
    onSectionChange('overview');
    setMgmtOpen((prev) => !prev); // also toggle the group when the parent itself is clicked
  }

  function handleChevronClick(event) {
    event.stopPropagation(); // don't trigger the parent's navigate-to-overview
    setMgmtOpen((prev) => !prev);
  }

  return (
    <main className="admin-shell">
      <aside className="admin-rail" aria-label="Admin navigation">
        <div className="admin-rail-brand">
          <span className="admin-rail-mark">CM</span>
          <div className="admin-rail-brand-text">
            <strong>CareerMap</strong>
            <small>Admin Console</small>
          </div>
        </div>

        <nav className="admin-rail-nav" aria-label="Admin sections">
          {/* Overview parent — its label routes to the overview, the chevron toggles the children. */}
          <div className={`admin-rail-parent${activeSection === 'overview' ? ' active' : ''}`}>
            <button
              type="button"
              className="admin-rail-parent-main"
              onClick={handleOverviewClick}
              aria-current={activeSection === 'overview' ? 'page' : undefined}
            >
              {NAV_ICONS.overview}
              <span className="admin-rail-nav-label">Overview</span>
            </button>
            <button
              type="button"
              className={`admin-rail-chevron${showGroup ? ' is-open' : ''}`}
              onClick={handleChevronClick}
              aria-expanded={showGroup}
              aria-controls="admin-rail-mgmt"
              aria-label={showGroup ? 'Thu gọn danh mục quản lý' : 'Mở rộng danh mục quản lý'}
              title={showGroup ? 'Thu gọn' : 'Mở rộng'}
            >
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3.5 5.5L7 9l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Management subgroup — collapses with a CSS animation. */}
          <div
            id="admin-rail-mgmt"
            className={`admin-rail-subnav${showGroup ? ' is-open' : ''}`}
            role="group"
            aria-label="Quản lý"
          >
            {MANAGEMENT_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`admin-rail-subnav-item${activeSection === section.id ? ' active' : ''}`}
                onClick={() => onSectionChange(section.id)}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                {NAV_ICONS[section.id]}
                <span className="admin-rail-nav-label">{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="admin-rail-account">
          <div className="admin-rail-id">
            <span className="admin-rail-avatar" title={session?.user?.fullName || 'Admin'}>
              {initials}
            </span>
            <div>
              <strong>{session?.user?.fullName || 'Admin'}</strong>
              <small>{session?.user?.email}</small>
            </div>
          </div>
          <button type="button" className="admin-rail-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{meta.title}</h1>
            <small>{meta.sub}</small>
          </div>
          <button type="button" className="pearl-button" onClick={onRefresh}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M11.5 7a4.5 4.5 0 11-1.32-3.18M11.5 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </header>
        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
