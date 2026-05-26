import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, CreditCard, ExternalLink, LoaderCircle, ShoppingBag } from 'lucide-react';
import { getMySubscriptions } from '../../subscriptions/subscriptionApi';
import '../../../styles/student-subscription.css';

function formatPrice(price, currency) {
  if (price === 0) return 'Miễn phí';
  if (currency === 'VND') {
    return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
  }
  return `${price} ${currency}`;
}

function statusLabel(status) {
  switch (status) {
    case 'Active': return 'Đang hoạt động';
    case 'Pending': return 'Chờ thanh toán';
    case 'Cancelled': return 'Đã hủy';
    case 'Expired': return 'Đã hết hạn';
    case 'CheckoutFailed': return 'Thanh toán thất bại';
    default: return status;
  }
}

export function StudentCartPage({ session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const mineData = await getMySubscriptions(session).catch(() => []);
        if (!cancelled) {
          setHistory(Array.isArray(mineData) ? mineData : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    // Set interval to update countdowns
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session]);

  const activeSubscription = history
    .filter((item) => item.status === 'Active')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0] || null;

  return (
    <section className="student-subscription anim-stagger">
      <header className="student-subscription-hero anim-fade-up">
        <span className="student-eyebrow">Giỏ hàng & Lịch sử</span>
        <h1>Lịch sử mua gói & Đơn hàng</h1>
        <p>
          Quản lý lịch sử giao dịch thanh toán gói đăng ký nâng cao của bạn.
          Các đơn hàng chưa thanh toán sẽ tự động hết hạn sau 10 phút.
        </p>
      </header>

      {activeSubscription && (
        <article className="student-subscription-current anim-hover-lift">
          <div>
            <small>Gói đang sử dụng</small>
            <h2>{activeSubscription.planName}</h2>
            <p>
              Đang hoạt động · Hạn dùng đến {new Date(activeSubscription.expiredAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <span className="student-subscription-status active">Đang hoạt động</span>
        </article>
      )}

      {loading ? (
        <div className="student-subscription-empty">
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Đang tải lịch sử đơn hàng...
        </div>
      ) : history.length === 0 ? (
        <div className="student-subscription-empty">
          <span><ShoppingBag size={28} aria-hidden="true" /></span>
          <p>Bạn chưa có đơn hàng hoặc lịch sử mua gói nào.</p>
        </div>
      ) : (
        <div className="student-subscription-history">
          <h2>Đơn hàng của bạn</h2>
          <div className="student-subscription-history-list">
            {history.map((item) => {
              // Check if pending order has expired (>10 minutes)
              const createdTime = new Date(item.createdAt).getTime();
              const diffMs = currentTime - createdTime;
              const diffMins = diffMs / (60 * 1000);
              const isExpiredPending = item.status === 'Pending' && diffMins > 10;
              const displayStatus = isExpiredPending ? 'Cancelled' : item.status;

              // Calculate remaining time for pending order
              const remainingMs = 10 * 60 * 1000 - diffMs;
              const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
              const remainingMinStr = Math.floor(remainingSecs / 60);
              const remainingSecStr = String(remainingSecs % 60).padStart(2, '0');

              return (
                <div key={item.id} className="student-subscription-history-item anim-hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', fontWeight: '600' }}>{item.planName}</strong>
                      <small style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--student-muted, #6e6e73)', marginTop: '4px' }}>
                        <Calendar size={13} /> Created: {new Date(item.createdAt).toLocaleString('vi-VN')}
                        {item.provider && <> · Provider: {item.provider}</>}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--student-ink, #1d1d1f)' }}>
                        {formatPrice(item.amount, item.currency)}
                      </span>
                      <span className={`student-subscription-status ${displayStatus.toLowerCase()}`}>
                        {statusLabel(displayStatus)}
                      </span>
                    </div>
                  </div>

                  {/* If Pending and not yet expired, show payment options */}
                  {item.status === 'Pending' && !isExpiredPending && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 149, 0, 0.05)',
                      border: '1px dashed rgba(255, 149, 0, 0.3)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginTop: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#b35900' }}>
                        <Clock size={14} />
                        <span>Hết hạn sau: <strong>{remainingMinStr}:{remainingSecStr}</strong></span>
                      </div>
                      {item.checkoutUrl && (
                        <a
                          href={item.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--student-primary, #0066cc)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#0071e3'}
                          onMouseLeave={(e) => e.target.style.background = 'var(--student-primary, #0066cc)'}
                        >
                          Thanh toán ngay <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
