import { useState } from 'react';
import { formatDate, formatMoney, getCount } from '../../../shared/format';
import { MetricCard, Panel, SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const paymentTabs = ['Transactions', 'Subscriptions', 'Invoices'];

export function PaymentsView({
  stats,
  payments,
  subscriptions,
  invoices,
  selectedPayment,
  onSelectPayment,
  onUpdatePaymentStatus,
}) {
  const [tab, setTab] = useState('Transactions');
  const [nextStatus, setNextStatus] = useState('Paid');
  const paidCount = getCount(stats.payments.byStatus, 'Paid');

  return (
    <section className="admin-section">
      <SectionHeader title="Payment management" subtitle={`${payments.length} transactions`} />
      <div className="metric-grid compact">
        <MetricCard label="Total revenue" value={formatMoney(stats.payments.totalRevenue)} detail="Paid only" />
        <MetricCard label="Monthly revenue" value={formatMoney(stats.payments.monthlyRevenue)} detail="Current month" />
        <MetricCard label="Paid" value={paidCount} detail="Transactions" />
      </div>

      <div className="admin-tabs">
        {paymentTabs.map((item) => (
          <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'Transactions' && (
        <div className="split-grid wide-left">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td><strong>{payment.userFullName}</strong><span>{payment.userEmail}</span></td>
                    <td>{payment.planName}</td>
                    <td>{formatMoney(payment.amount, payment.currency)}</td>
                    <td><StatusPill label={payment.status} active={payment.status === 'Paid'} /></td>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td className="table-actions"><button type="button" onClick={() => onSelectPayment(payment.id)}>Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Panel title="Payment detail">
            {selectedPayment ? (
              <div className="detail-stack">
                <strong>{selectedPayment.planName}</strong>
                <span>{selectedPayment.userFullName} · {selectedPayment.userEmail}</span>
                <span>{formatMoney(selectedPayment.amount, selectedPayment.currency)}</span>
                <StatusPill label={selectedPayment.status} active={selectedPayment.status === 'Paid'} />
                <span>Provider: {selectedPayment.provider}</span>
                <span>Transaction: {selectedPayment.providerTransactionId || '-'}</span>
                <span>Paid at: {selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '-'}</span>
                {selectedPayment.checkoutUrl && <a className="text-link" href={selectedPayment.checkoutUrl} target="_blank" rel="noreferrer">Open checkout</a>}
                <div className="inline-form">
                  <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="Created">Created</option>
                  </select>
                  <button type="button" onClick={() => onUpdatePaymentStatus(selectedPayment.id, nextStatus)}>
                    Update status
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-text">Chọn một transaction để xem chi tiết.</p>
            )}
          </Panel>
        </div>
      )}

      {tab === 'Subscriptions' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Plan</th><th>Status</th><th>Started</th><th>Expired</th><th>Provider</th></tr></thead>
            <tbody>
              {subscriptions.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.userFullName}</strong><span>{item.userEmail}</span></td>
                  <td>{item.planName}</td>
                  <td><StatusPill label={item.status} active={item.status === 'Active'} /></td>
                  <td>{formatDate(item.startedAt)}</td>
                  <td>{formatDate(item.expiredAt)}</td>
                  <td>{item.provider || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Invoices' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Invoice</th><th>Amount</th><th>Issued</th><th>PDF</th></tr></thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.userFullName}</strong><span>{invoice.userEmail}</span></td>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{formatMoney(invoice.amount, invoice.currency)}</td>
                  <td>{formatDate(invoice.issuedAt)}</td>
                  <td>{invoice.pdfUrl ? <a className="text-link" href={invoice.pdfUrl}>Open</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
