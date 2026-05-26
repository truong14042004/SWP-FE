import { useEffect, useMemo, useState } from 'react';
import { getMySubscriptions } from './subscriptionApi';
import { formatDate } from '../../shared/format';
import '../../styles/payment.css';

export function PaymentResultPage({ type, session, onLogin, onHome }) {
  const [status, setStatus] = useState(type === 'success' ? 'checking' : 'cancelled');
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const latestSubscription = subscriptions[0];
  const activeSubscription = subscriptions
    .filter((item) => item.status === 'Active')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0] || null;

  useEffect(() => {
    if (type !== 'success' || !session) {
      return;
    }

    let isMounted = true;

    async function verifySubscription() {
      setStatus('checking');
      setError('');

      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const result = await getMySubscriptions(session);
          if (!isMounted) {
            return;
          }

          setSubscriptions(result);
          if (result.some((item) => item.status === 'Active')) {
            setStatus('confirmed');
            return;
          }

          setStatus('pending');
        } catch (requestError) {
          if (!isMounted) {
            return;
          }
          setError(requestError.message);
          setStatus('error');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    verifySubscription();

    return () => {
      isMounted = false;
    };
  }, [session, type]);

  if (!session) {
    return (
      <PaymentShell
        eyebrow="Payment session"
        title="Bạn cần đăng nhập lại"
        description="Phiên đăng nhập không còn trong trình duyệt này. Đăng nhập lại để kiểm tra trạng thái gói."
      >
        <button type="button" className="pill-button" onClick={onLogin}>
          Đăng nhập
        </button>
      </PaymentShell>
    );
  }

  if (type === 'cancel') {
    return (
      <PaymentShell
        eyebrow="Payment cancelled"
        title="Thanh toán đã bị hủy"
        description="Gói chưa được kích hoạt. Bạn có thể quay lại trang chủ và chọn thanh toán lại bất cứ lúc nào."
      >
        <PaymentMeta query={query} />
        <button type="button" className="pill-button" onClick={onHome}>
          Về trang chủ
        </button>
      </PaymentShell>
    );
  }

  const title = status === 'confirmed'
    ? 'Thanh toán thành công'
    : status === 'pending'
      ? 'Đang xác nhận thanh toán'
      : status === 'error'
        ? 'Chưa kiểm tra được thanh toán'
        : 'Đang kiểm tra gói của bạn';

  const description = status === 'confirmed'
    ? `Gói ${activeSubscription?.planName || 'mới'} đã được kích hoạt cho tài khoản.`
    : status === 'pending'
      ? 'PayOS đã chuyển bạn về hệ thống. CareerMap đang chờ webhook xác nhận để kích hoạt gói.'
      : status === 'error'
        ? error
        : 'CareerMap đang đồng bộ trạng thái thanh toán từ server.';

  return (
    <PaymentShell eyebrow="Payment result" title={title} description={description}>
      <PaymentMeta query={query} />
      {latestSubscription && (
        <div className="payment-summary">
          <span>Latest subscription</span>
          <strong>{latestSubscription.planName}</strong>
          <small>
            {latestSubscription.status}
            {latestSubscription.expiredAt ? ` · hết hạn ${formatDate(latestSubscription.expiredAt)}` : ''}
          </small>
        </div>
      )}
      <div className="payment-actions">
        <button type="button" className="pill-button" onClick={onHome}>
          Về trang chủ
        </button>
        <button type="button" className="secondary-action" onClick={() => window.location.reload()}>
          Kiểm tra lại
        </button>
      </div>
    </PaymentShell>
  );
}

function PaymentShell({ eyebrow, title, description, children }) {
  return (
    <main className="payment-shell">
      <section className="payment-card">
        <div className="brand-row compact">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </main>
  );
}

function PaymentMeta({ query }) {
  const orderCode = query.get('orderCode');
  const code = query.get('code');
  const status = query.get('status');

  if (!orderCode && !code && !status) {
    return null;
  }

  return (
    <dl className="payment-meta">
      {orderCode && <><dt>Order code</dt><dd>{orderCode}</dd></>}
      {code && <><dt>Code</dt><dd>{code}</dd></>}
      {status && <><dt>Status</dt><dd>{status}</dd></>}
    </dl>
  );
}
