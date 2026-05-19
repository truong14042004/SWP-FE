/**
 * Apple-inspired admin primitives.
 * - Single accent (Action Blue) for interactive signals.
 * - Hairlines for structure, no decorative shadows.
 * - Typography ladder: tagline / display-md / body / caption.
 */

export function KpiTile({ label, value, sub, tone }) {
  const cls = ['kpi-tile'];
  if (tone) cls.push(`tone-${tone}`);
  return (
    <article className={cls.join(' ')}>
      <span className="kpi-tile-label">{label}</span>
      <strong className="kpi-tile-value">{value}</strong>
      {sub && <span className="kpi-tile-sub">{sub}</span>}
    </article>
  );
}

export function KpiRow({ children }) {
  return <div className="kpi-row">{children}</div>;
}

export function SurfaceCard({ title, action, children, tight }) {
  return (
    <article className={`surface-card${tight ? ' tight' : ''}`}>
      {(title || action) && (
        <header className="section-title-row">
          {title && <h3 className="surface-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </article>
  );
}

export function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <header className="section-title-row">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <small>{subtitle}</small>}
      </div>
      {action}
    </header>
  );
}

export function StatusPill({ active, label, tone }) {
  const variant = tone || (active ? 'active' : 'inactive');
  return (
    <span className={`status-pill ${variant}`}>
      {label || (active ? 'Active' : 'Inactive')}
    </span>
  );
}

export function StatusRows({ items }) {
  if (!items?.length) {
    return <p className="empty-state">No data yet.</p>;
  }
  return (
    <div className="status-rows">
      {items.map(([label, value]) => (
        <div key={label} className="status-row">
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function RankedList({ items = [], labelKey = 'name', valueKey = 'count' }) {
  if (!items.length) {
    return <p className="empty-state">No data yet.</p>;
  }
  return (
    <ol className="ranked-list">
      {items.slice(0, 8).map((item, index) => (
        <li key={item.id || item[labelKey] || index}>
          <span className="rank-num">{index + 1}</span>
          <strong>{item[labelKey]}</strong>
          <em>{item[valueKey]}</em>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ children = 'Nothing here yet.' }) {
  return <p className="empty-state">{children}</p>;
}

/* Legacy aliases — kept so any straggler imports still work. */
export const MetricCard = KpiTile;
export const Panel = SurfaceCard;
export const SectionHeader = SectionTitle;
