import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, LoaderCircle, MailOpen } from 'lucide-react';
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../../subscriptions/subscriptionApi';
import '../../../styles/student-subscription.css';

function formatPrice(price, currency) {
  if (price === 0) return 'Miễn phí';
  if (currency === 'VND') {
    return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
  }
  return `${price} ${currency}`;
}

function billingLabel(cycle) {
  switch ((cycle || '').toLowerCase()) {
    case 'monthly': return '/tháng';
    case 'yearly': return '/năm';
    case 'quarterly': return '/quý';
    default: return '';
  }
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

export function StudentSubscriptionPage({ session }) {
  const [plans, setPlans] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [plansData, mineData] = await Promise.all([
          getSubscriptionPlans().catch(() => []),
          getMySubscriptions(session).catch(() => []),
        ]);
        if (!cancelled) {
          setPlans(Array.isArray(plansData) ? plansData : []);
          setMySubscriptions(Array.isArray(mineData) ? mineData : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const activeSubscription = mySubscriptions.find((item) => item.status === 'Active');
  const activePlanId = activeSubscription?.planId || null;

  async function handleCheckout(plan) {
    setCheckoutLoadingId(plan.id);
    try {
      const result = await createSubscriptionCheckout(session, plan.id);

      // Free plan or already-active free → no redirect
      if (!result?.checkoutUrl) {
        toast.success('Đã kích hoạt gói miễn phí.');
        const mine = await getMySubscriptions(session).catch(() => []);
        setMySubscriptions(Array.isArray(mine) ? mine : []);
        return;
      }

      // Paid plan → redirect to PayOS
      toast.info('Đang chuyển tới cổng thanh toán...');
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      toast.error(error.message || 'Không tạo được phiên thanh toán.');
    } finally {
      setCheckoutLoadingId('');
    }
  }

  async function handleCancel() {
    if (!activeSubscription) return;
    const planLabel = activeSubscription.planName || 'gói hiện tại';
    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy “${planLabel}”?\n\nSau khi hủy, bạn sẽ mất các quyền lợi đi kèm (lượt mentor review, tính năng cao cấp) và cần mua lại nếu muốn dùng tiếp.`,
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await cancelSubscription(session);
      toast.success('Đã hủy gói. Các quyền lợi sẽ kết thúc ngay.');
      const mine = await getMySubscriptions(session).catch(() => []);
      setMySubscriptions(Array.isArray(mine) ? mine : []);
    } catch (error) {
      toast.error(error.message || 'Không hủy được gói.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="student-subscription">
      <header className="student-subscription-hero">
        <span className="student-eyebrow">Subscription</span>
        <h1>Chọn gói phù hợp với bạn</h1>
        <p>
          Mở khóa thêm lượt review từ Industry Mentor, ưu tiên hỗ trợ và các tính
          năng cao cấp khác để tăng tốc lộ trình nghề nghiệp của bạn.
        </p>
      </header>

      {activeSubscription && (
        <article className="student-subscription-current">
          <div>
            <small>Gói hiện tại</small>
            <h2>{activeSubscription.planName}</h2>
            <p>
              {statusLabel(activeSubscription.status)}
              {activeSubscription.expiredAt && (
                <> · hết hạn {new Date(activeSubscription.expiredAt).toLocaleDateString('vi-VN')}</>
              )}
            </p>
          </div>
          <button
            type="button"
            className="student-subscription-cancel"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Đang hủy...' : 'Hủy gói'}
          </button>
        </article>
      )}

      {loading ? (
        <div className="student-subscription-empty"><LoaderCircle size={18} aria-hidden="true" /> Đang tải bảng giá...</div>
      ) : plans.length === 0 ? (
        <div className="student-subscription-empty">
          <span><MailOpen size={28} aria-hidden="true" /></span>
          <p>Hiện chưa có gói khả dụng. Vui lòng thử lại sau.</p>
        </div>
      ) : (
        <div className="student-subscription-grid">
          {plans.map((plan, index) => {
            const features = parsePlanFeatures(plan.featuresJson);
            const isCurrent = plan.id === activePlanId;
            const isFeatured = !isCurrent && index === Math.min(1, plans.length - 1);

            return (
              <article
                key={plan.id}
                className={`student-subscription-card ${isFeatured ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {isFeatured && <span className="student-subscription-tag">Phổ biến</span>}
                {isCurrent && <span className="student-subscription-tag current">Đang dùng</span>}

                <h3>{plan.name}</h3>
                {plan.description && <p className="student-subscription-desc">{plan.description}</p>}

                <div className="student-subscription-price">
                  <strong>{formatPrice(plan.price, plan.currency)}</strong>
                  <small>{billingLabel(plan.billingCycle)}</small>
                </div>

                <ul className="student-subscription-features">
                  {features.mentorReviewLimit > 0 && (
                    <li><Check size={14} aria-hidden="true" /> {features.mentorReviewLimit} lượt mentor review / chu kỳ</li>
                  )}
                  {(features.features || []).map((feature, idx) => (
                    <li key={idx}><Check size={14} aria-hidden="true" /> {feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="student-subscription-cta"
                  onClick={() => handleCheckout(plan)}
                  disabled={isCurrent || checkoutLoadingId === plan.id}
                >
                  {isCurrent
                    ? 'Đang sử dụng'
                    : checkoutLoadingId === plan.id
                    ? 'Đang xử lý...'
                    : plan.price === 0
                    ? 'Kích hoạt miễn phí'
                    : 'Mua gói này'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {mySubscriptions.length > 0 && (
        <section className="student-subscription-history">
          <h2>Lịch sử đăng ký</h2>
          <div className="student-subscription-history-list">
            {mySubscriptions.map((item) => (
              <div key={item.id} className="student-subscription-history-item">
                <div>
                  <strong>{item.planName}</strong>
                  <small>
                    Tạo lúc {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    {item.provider && <> · {item.provider}</>}
                  </small>
                </div>
                <span className={`student-subscription-status ${item.status.toLowerCase()}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
