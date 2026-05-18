import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { formatMoney, getCount } from '../../../shared/format';

const COLORS = {
  blue:   '#0066cc',
  green:  '#16a34a',
  purple: '#9333ea',
  orange: '#ea580c',
  amber:  '#d97706',
  red:    '#dc2626',
  teal:   '#0891b2',
  indigo: '#6366f1',
};

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="ov-kpi-card" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="ov-kpi-label">{label}</span>
      <strong className="ov-kpi-value">{value}</strong>
      {sub && <span className="ov-kpi-sub">{sub}</span>}
    </div>
  );
}

function ChartCard({ title, children, wide }) {
  return (
    <div className={`ov-chart-card${wide ? ' ov-chart-card--wide' : ''}`}>
      <h3 className="ov-chart-title">{title}</h3>
      {children}
    </div>
  );
}

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ov-tooltip">
      {label && <p className="ov-tooltip-label">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const pieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="ov-tooltip">
      <strong>{name}</strong>: {value}
    </div>
  );
};

export function OverviewView({ stats }) {
  const { users, subscriptions, payments, content } = stats ?? {};

  /* ── Derived counts ── */
  const paidCount    = getCount(payments?.byStatus, 'Paid');
  const pendingCount = getCount(payments?.byStatus, 'Pending') + getCount(payments?.byStatus, 'Created');
  const failedCount  = getCount(payments?.byStatus, 'Failed')  + getCount(payments?.byStatus, 'PaymentFailed');

  /* ── Chart data ── */
  const userRoleData = (users?.byRole ?? []).map((r) => ({
    name: r.name,
    value: r.count,
  }));

  const paymentData = [
    { name: 'Paid',    value: paidCount,    fill: COLORS.green  },
    { name: 'Pending', value: pendingCount, fill: COLORS.amber  },
    { name: 'Failed',  value: failedCount,  fill: COLORS.red    },
  ];

  const subsData = [
    { name: 'Active',    value: subscriptions?.active    ?? 0, fill: COLORS.green  },
    { name: 'Pending',   value: subscriptions?.pending   ?? 0, fill: COLORS.amber  },
    { name: 'Cancelled', value: subscriptions?.cancelled ?? 0, fill: COLORS.red    },
  ];

  const planData = (subscriptions?.plans ?? []).map((p) => ({
    name: p.name,
    subscribers: p.activeCount ?? p.count ?? 0,
  }));

  const contentData = [
    { name: 'Skills',          value: content?.totalSkills           ?? 0 },
    { name: 'Active skills',   value: content?.activeSkills          ?? 0 },
    { name: 'Resources',       value: content?.totalLearningResources ?? 0 },
    { name: 'Career roles',    value: content?.totalCareerRoles      ?? 0 },
  ];

  const popularRoles = (content?.popularCareerRoles ?? []).map((r) => ({
    name: r.name,
    students: r.selectedCount,
  }));

  const roleColors = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.orange, COLORS.teal];

  return (
    <section className="admin-section">

      {/* ── KPI Row ── */}
      <div className="ov-kpi-row">
        <KpiCard
          label="Total users"
          value={users?.total ?? '—'}
          sub={`${users?.active ?? 0} active · ${users?.inactive ?? 0} inactive`}
          accent={COLORS.blue}
        />
        <KpiCard
          label="Revenue (all time)"
          value={formatMoney(payments?.totalRevenue ?? 0)}
          sub={`This month: ${formatMoney(payments?.monthlyRevenue ?? 0)}`}
          accent={COLORS.green}
        />
        <KpiCard
          label="Active subscriptions"
          value={subscriptions?.active ?? '—'}
          sub={`${subscriptions?.pending ?? 0} pending · ${subscriptions?.cancelled ?? 0} cancelled`}
          accent={COLORS.purple}
        />
        <KpiCard
          label="Learning resources"
          value={content?.totalLearningResources ?? '—'}
          sub={`${content?.activeSkills ?? 0} active skills · ${content?.totalCareerRoles ?? 0} career roles`}
          accent={COLORS.orange}
        />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="ov-charts-row">

        {/* Users by role — Pie */}
        <ChartCard title="Users by role">
          {userRoleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {userRoleData.map((_, i) => (
                    <Cell key={i} fill={roleColors[i % roleColors.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={pieTooltip} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 12, color: '#444' }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="ov-empty">No user data.</p>
          )}
        </ChartCard>

        {/* Payment breakdown — Bar */}
        <ChartCard title="Payment breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paymentData} barSize={36} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="value" name="Transactions" radius={[6, 6, 0, 0]}>
                {paymentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="ov-revenue-row">
            <div className="ov-revenue-item">
              <span>Total</span>
              <strong style={{ color: COLORS.green }}>{formatMoney(payments?.totalRevenue ?? 0)}</strong>
            </div>
            <div className="ov-revenue-item">
              <span>This month</span>
              <strong style={{ color: COLORS.blue }}>{formatMoney(payments?.monthlyRevenue ?? 0)}</strong>
            </div>
          </div>
        </ChartCard>

        {/* Subscriptions — Bar */}
        <ChartCard title="Subscriptions">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subsData} barSize={36} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {subsData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {planData.length > 0 && (
            <>
              <p className="ov-chart-sub-title">By plan</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={planData} barSize={28} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="subscribers" name="Subscribers" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </ChartCard>

        {/* Content — Bar */}
        <ChartCard title="Content overview">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contentData} barSize={32} layout="vertical" margin={{ top: 4, right: 24, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#555' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="value" name="Count" fill={COLORS.orange} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* ── Popular Career Roles — full-width ── */}
      {popularRoles.length > 0 && (
        <ChartCard title="Popular career roles" wide>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={popularRoles} barSize={28} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="students" name="Students" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </section>
  );
}
