export function MetricCard({ label, value, detail, accent }) {
  return (
    <article className="metric-card" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {detail && <small className="metric-detail">{detail}</small>}
    </article>
  );
}

export function Panel({ title, children }) {
  return (
    <article className="panel">
      {title && <h3 className="panel-title">{title}</h3>}
      {children}
    </article>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle && <span className="section-subtitle">{subtitle}</span>}
    </div>
  );
}

export function StatusPill({ active, label }) {
  return (
    <span className={`status-pill ${active ? 'active' : 'inactive'}`}>
      {label || (active ? 'Active' : 'Inactive')}
    </span>
  );
}

export function StatusRows({ items }) {
  return (
    <div className="status-rows">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function RankedList({ items = [], labelKey = 'name', valueKey = 'count' }) {
  if (!items.length) return <p className="empty-text">Chưa có dữ liệu.</p>;
  return (
    <ol className="ranked-list">
      {items.slice(0, 8).map((item, index) => (
        <li key={item.id || item[labelKey]}>
          <span className="rank-num">{index + 1}</span>
          <strong>{item[labelKey]}</strong>
          <em>{item[valueKey]}</em>
        </li>
      ))}
    </ol>
  );
}
