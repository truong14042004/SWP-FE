import { useState } from 'react';
import './dashboard-shell.css';

/* ────────────────────────────────────────────────────────────
   DashboardShell — shared sidebar layout for Counselor / Mentor
   (and other role workspaces). Pass navItems, active id, and a
   click handler; render the active view in children.
   ──────────────────────────────────────────────────────────── */

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

export function DashboardShell({
  brand = 'CareerMap',
  brandSubtitle,
  brandMark = 'CM',
  navItems = [],
  activeId,
  onNavigate,
  session,
  onSignOut,
  signOutLabel = 'Đăng xuất',
  topbarTitle,
  topbarSubtitle,
  topbarActions = null,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const initials = getInitials(session?.user?.fullName);

  return (
    <div className={`ds-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="ds-rail" aria-label={`${brandSubtitle || brand} navigation`}>
        <div className="ds-rail-brand">
          <span className="ds-rail-mark" aria-hidden>{brandMark}</span>
          <div className="ds-rail-brand-text">
            <strong>{brand}</strong>
            {brandSubtitle && <small>{brandSubtitle}</small>}
          </div>
          <button
            type="button"
            className="ds-rail-collapse"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <svg viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d={collapsed ? 'M5 3.5L8.5 7 5 10.5' : 'M9 3.5L5.5 7 9 10.5'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav className="ds-rail-nav" aria-label={`${brandSubtitle || brand} sections`}>
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                className={`ds-rail-nav-item${isActive ? ' active' : ''}`}
                onClick={() => onNavigate?.(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <span className="ds-rail-nav-icon" aria-hidden>{item.icon}</span>
                <span className="ds-rail-nav-label">{item.label}</span>
                {item.badge != null && item.badge !== 0 && (
                  <span className="ds-rail-nav-badge" aria-label={`${item.badge} mục`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="ds-rail-account">
          <div className="ds-rail-id">
            <span className="ds-rail-avatar" title={session?.user?.fullName || 'User'}>
              {initials}
            </span>
            <div className="ds-rail-id-text">
              <strong>{session?.user?.fullName || 'User'}</strong>
              {session?.user?.email && <small>{session.user.email}</small>}
            </div>
          </div>
          <button type="button" className="ds-rail-signout" onClick={onSignOut}>
            {signOutLabel}
          </button>
        </div>
      </aside>

      <section className="ds-main">
        {(topbarTitle || topbarSubtitle || topbarActions) && (
          <header className="ds-topbar">
            <div className="ds-topbar-text">
              {topbarTitle && <h1>{topbarTitle}</h1>}
              {topbarSubtitle && <small>{topbarSubtitle}</small>}
            </div>
            {topbarActions && <div className="ds-topbar-actions">{topbarActions}</div>}
          </header>
        )}
        <div className="ds-content">{children}</div>
      </section>
    </div>
  );
}
