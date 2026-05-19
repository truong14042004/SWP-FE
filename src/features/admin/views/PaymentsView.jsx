import { useState } from 'react';
import { formatDate, formatMoney, getCount } from '../../../shared/format';
import {
  KpiRow,
  KpiTile,
  SectionTitle,
  StatusPill,
  SurfaceCard,
} from '../components/DashboardPrimitives';

const TABS = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'invoices', label: 'Invoices' },
];

const STATUS_OPTIONS = ['Paid', 'Failed', 'Pending', 'Created'];

function paymentTone(status) {
  switch (status?.toLowerCase()) {
    case 'paid':         return 'active';
    case 'failed':
    case 'paymentfailed': return 'danger';
    case 'pending':
    case 'created':       return 'warning';
    default:              return 'inactive';
  }
}

function subscriptionTone(status) {
  switch (status?.toLowerCase()) {
    case 'active':    return 'active';
    case 'pending':   return 'warning';
    case 'cancelled': return 'danger';
    default:          return 'inactive';
  }
}

export function PaymentsView({
  stats,
  payments,
  subscriptions,
  invoices,
  selectedPayment,
  onSelectPayment,
  onUpdatePaymentStatus,
}) {
  const [tab, setTab] = useState('transactions');
  const [nextStatus, setNextStatus] = useState('Paid');

  const paymentStats = stats?.payments || {};
  const paidCount = getCount(paymentStats.byStatus, 'Paid');
  const failedCount = getCount(paymentStats.byStatus, 'Failed') + getCount(paymentStats.byStatus, 'PaymentFailed');
  const pendingCount = getCount(paymentStats.byStatus, 'Pending') + getCount(paymentStats.byStatus, 'Created');

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Finance"
        title="Payments"
        subtitle={`${payments.length} transactions · ${subscriptions.length} subscriptions · ${invoices.length} invoices`}
      />

      <KpiRow>
        <KpiTile label="Lifetime revenue" value={formatMoney(paymentStats.totalRevenue || 0)} sub="Paid only" />
        <KpiTile label="This month" value={formatMoney(paymentStats.monthlyRevenue || 0)} sub="Current month" tone="active" />
        <KpiTile label="Paid" value={paidCount} sub={`${pendingCount} pending`} />
        <KpiTile label="Failed" value={failedCount} tone={failedCount ? 'warning' : 'muted'} sub="Needs review" />
      </KpiRow>

      <div className="segmented" role="tablist" aria-label="Payment views">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="split-grid">
          <div className="data-table-wrap">
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>{payment.userFullName}</strong>
                        <span>{payment.userEmail}</span>
                      </td>
                      <td>{payment.planName}</td>
                      <td>{formatMoney(payment.amount, payment.currency)}</td>
                      <td><StatusPill label={payment.status} tone={paymentTone(payment.status)} /></td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td className="table-actions">
                        <button type="button" className="btn-secondary" onClick={() => onSelectPayment(payment.id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!payments.length && (
                    <tr>
                      <td colSpan={6}><p className="empty-state">No transactions yet.</p></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <SurfaceCard title="Payment detail">
            {selectedPayment ? (
              <div className="detail-stack">
                <strong>{selectedPayment.planName}</strong>
                <span>{selectedPayment.userFullName} · {selectedPayment.userEmail}</span>
                <span>{formatMoney(selectedPayment.amount, selectedPayment.currency)}</span>
                <div>
                  <StatusPill label={selectedPayment.status} tone={paymentTone(selectedPayment.status)} />
                </div>
                <span>Provider: {selectedPayment.provider}</span>
                <span>Transaction: {selectedPayment.providerTransactionId || '-'}</span>
                <span>Paid at: {selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '-'}</span>
                {selectedPayment.checkoutUrl && (
                  <a className="text-link" href={selectedPayment.checkoutUrl} target="_blank" rel="noreferrer">
                    Open checkout →
                  </a>
                )}

                <div className="inline-form">
                  <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => onUpdatePaymentStatus(selectedPayment.id, nextStatus)}
                  >
                    Update
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-state">Select a transaction to inspect.</p>
            )}
          </SurfaceCard>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="data-table-wrap">
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Expired</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.userFullName}</strong>
                      <span>{item.userEmail}</span>
                    </td>
                    <td>{item.planName}</td>
                    <td><StatusPill label={item.status} tone={subscriptionTone(item.status)} /></td>
                    <td>{formatDate(item.startedAt)}</td>
                    <td>{formatDate(item.expiredAt)}</td>
                    <td>{item.provider || '-'}</td>
                  </tr>
                ))}
                {!subscriptions.length && (
                  <tr><td colSpan={6}><p className="empty-state">No subscriptions yet.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="data-table-wrap">
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.userFullName}</strong>
                      <span>{invoice.userEmail}</span>
                    </td>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{formatMoney(invoice.amount, invoice.currency)}</td>
                    <td>{formatDate(invoice.issuedAt)}</td>
                    <td>
                      {invoice.pdfUrl ? (
                        <a className="text-link" href={invoice.pdfUrl} target="_blank" rel="noreferrer">Open →</a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr><td colSpan={5}><p className="empty-state">No invoices issued.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
