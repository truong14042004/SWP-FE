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
  { id: 'transactions', label: 'Giao dịch' },
  { id: 'subscriptions', label: 'Gói đăng ký' },
  { id: 'invoices', label: 'Hóa đơn' },
];

const STATUS_OPTIONS = ['Paid', 'Failed', 'Pending', 'Created'];

const STATUS_LABELS = {
  Paid: 'Đã thanh toán',
  Failed: 'Thất bại',
  Pending: 'Đang chờ',
  Created: 'Đã khởi tạo',
};

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
        eyebrow="Tài chính"
        title="Thanh toán"
        subtitle={`${payments.length} giao dịch · ${subscriptions.length} gói đăng ký · ${invoices.length} hóa đơn`}
      />

      <KpiRow>
        <KpiTile label="Doanh thu trọn đời" value={formatMoney(paymentStats.totalRevenue || 0)} sub="Chỉ tính đã thanh toán" />
        <KpiTile label="Tháng này" value={formatMoney(paymentStats.monthlyRevenue || 0)} sub="Tháng hiện tại" tone="active" />
        <KpiTile label="Đã thanh toán" value={paidCount} sub={`${pendingCount} đang chờ`} />
        <KpiTile label="Thất bại" value={failedCount} tone={failedCount ? 'warning' : 'muted'} sub="Cần xem xét" />
      </KpiRow>

      <div className="segmented" role="tablist" aria-label="Chế độ xem thanh toán">
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
                    <th>Khách hàng</th>
                    <th>Gói</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
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
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!payments.length && (
                    <tr>
                      <td colSpan={6}><p className="empty-state">Chưa có giao dịch nào.</p></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <SurfaceCard title="Chi tiết thanh toán">
            {selectedPayment ? (
              <div className="detail-stack">
                <strong>{selectedPayment.planName}</strong>
                <span>{selectedPayment.userFullName} · {selectedPayment.userEmail}</span>
                <span>{formatMoney(selectedPayment.amount, selectedPayment.currency)}</span>
                <div>
                  <StatusPill label={selectedPayment.status} tone={paymentTone(selectedPayment.status)} />
                </div>
                <span>Nhà cung cấp: {selectedPayment.provider}</span>
                <span>Mã giao dịch: {selectedPayment.providerTransactionId || '-'}</span>
                <span>Thanh toán lúc: {selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '-'}</span>
                {selectedPayment.checkoutUrl && (
                  <a className="text-link" href={selectedPayment.checkoutUrl} target="_blank" rel="noreferrer">
                    Mở trang thanh toán →
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
                    Cập nhật
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-state">Chọn một giao dịch để xem chi tiết.</p>
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
                  <th>Người dùng</th>
                  <th>Gói</th>
                  <th>Trạng thái</th>
                  <th>Bắt đầu</th>
                  <th>Hết hạn</th>
                  <th>Nhà cung cấp</th>
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
                  <tr><td colSpan={6}><p className="empty-state">Chưa có gói đăng ký nào.</p></td></tr>
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
                  <th>Người dùng</th>
                  <th>Hóa đơn</th>
                  <th>Số tiền</th>
                  <th>Ngày phát hành</th>
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
                        <a className="text-link" href={invoice.pdfUrl} target="_blank" rel="noreferrer">Mở →</a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr><td colSpan={5}><p className="empty-state">Chưa có hóa đơn nào.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
