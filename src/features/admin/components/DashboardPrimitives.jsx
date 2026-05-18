export function MetricCard({ label, value, detail }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function Panel({ title, children }) {
  return <article className="panel"><h2>{title}</h2>{children}</article>;
}

export function SectionHeader({ title, subtitle }) {
  return <div className="section-header"><div><p className="eyebrow">Admin module</p><h2>{title}</h2></div><span>{subtitle}</span></div>;
}

export function StatusPill({ active, label }) {
  return <span className={`status-pill ${active ? 'active' : 'inactive'}`}>{label || (active ? 'Active' : 'Inactive')}</span>;
}

export function StatusRows({ items }) {
  return <div className="status-rows">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

export function RankedList({ items = [], labelKey = 'name', valueKey = 'count' }) {
  if (!items.length) return <p className="empty-text">Chưa có dữ liệu.</p>;
  return (
    <ol className="ranked-list">
      {items.slice(0, 8).map((item, index) => (
        <li key={item.id || item[labelKey]}><span>{index + 1}</span><strong>{item[labelKey]}</strong><em>{item[valueKey]}</em></li>
      ))}
    </ol>
  );
}
