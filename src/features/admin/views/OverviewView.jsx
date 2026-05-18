import { getCount, formatMoney } from '../../../shared/format';
import { MetricCard, Panel, RankedList, StatusRows } from '../components/DashboardPrimitives';

export function OverviewView({ stats }) {
  const revenue = stats?.payments?.totalRevenue || 0;
  const paidCount = getCount(stats?.payments?.byStatus, 'Paid');
  const pendingPayments = getCount(stats?.payments?.byStatus, 'Pending') + getCount(stats?.payments?.byStatus, 'Created');
  const failedPayments = getCount(stats?.payments?.byStatus, 'Failed') + getCount(stats?.payments?.byStatus, 'PaymentFailed') + getCount(stats?.payments?.byStatus, 'PaymentLinkFailed');

  return (
    <section className="admin-section">
      <div className="metric-grid">
        <MetricCard label="Users" value={stats.users.total} detail={`${stats.users.active} active`} />
        <MetricCard label="Revenue" value={formatMoney(revenue)} detail={`${paidCount} paid payments`} />
        <MetricCard label="Subscriptions" value={stats.subscriptions.active} detail={`${stats.subscriptions.pending} pending`} />
        <MetricCard label="Resources" value={stats.learningResources.total} detail={`${stats.learningResources.fileResources} files`} />
      </div>
      <div className="split-grid">
        <Panel title="Payment health"><StatusRows items={[["Paid", paidCount], ["Pending", pendingPayments], ["Failed", failedPayments]]} /></Panel>
        <Panel title="Popular career roles"><RankedList items={stats.careerRoles.popularRoles} valueKey="selectedCount" /></Panel>
      </div>
    </section>
  );
}
