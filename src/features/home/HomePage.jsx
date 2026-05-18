import { useEffect, useMemo, useState } from 'react';
import {
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../subscriptions/subscriptionApi';
import { formatDate, formatMoney } from '../../shared/format';

export function HomePage({ session, onLogin, onSignOut }) {
  const isStudent = session?.user?.role === 'Student';
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plansStatus, setPlansStatus] = useState('idle');
  const [checkoutPlanId, setCheckoutPlanId] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const activeSubscription = useMemo(
    () => subscriptions.find((item) => item.status === 'Active'),
    [subscriptions],
  );

  useEffect(() => {
    loadPlans();
  }, [session?.token]);

  async function loadPlans() {
    setPlansStatus('loading');
    setPaymentError('');

    try {
      const [planList, subscriptionList] = await Promise.all([
        getSubscriptionPlans(),
        session ? getMySubscriptions(session).catch(() => []) : Promise.resolve([]),
      ]);
      setPlans(planList);
      setSubscriptions(subscriptionList);
      setPlansStatus('ready');
    } catch (error) {
      setPaymentError(error.message);
      setPlansStatus('error');
    }
  }

  async function buyPlan(plan) {
    setPaymentMessage('');
    setPaymentError('');

    if (!session) {
      onLogin();
      return;
    }

    setCheckoutPlanId(plan.id);
    try {
      const checkout = await createSubscriptionCheckout(session, plan.id);
      if (checkout.checkoutUrl) {
        window.location.assign(checkout.checkoutUrl);
        return;
      }

      setPaymentMessage('Gói miễn phí đã được kích hoạt cho tài khoản của bạn.');
      await loadPlans();
    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setCheckoutPlanId('');
    }
  }

  return (
    <main className="home-shell">
      <nav className="home-nav" aria-label="CareerMap navigation">
        <div className="brand-row compact">
          <span className="brand-mark">CM</span>
          <span>CareerMap</span>
        </div>
        <div className="home-nav-actions">
          {session ? (
            <>
              <span>{session.user.fullName}</span>
              <button type="button" className="secondary-action" onClick={onSignOut}>
                Đăng xuất
              </button>
            </>
          ) : (
            <button type="button" className="pill-button" onClick={onLogin}>
              Đăng nhập
            </button>
          )}
        </div>
      </nav>

      <section className="home-hero">
        <div>
          <p className="eyebrow">{isStudent ? 'Student workspace' : 'Career guidance platform'}</p>
          <h1>{isStudent ? 'Tiếp tục lộ trình nghề nghiệp của bạn.' : 'Lộ trình học tập rõ ràng cho từng mục tiêu nghề nghiệp.'}</h1>
          <p>
            CareerMap giúp sinh viên chọn career role, phân tích skill gap, xem roadmap,
            truy cập tài liệu theo từng node và nhận mentor review cho portfolio.
          </p>
          <div className="home-actions">
            {session ? (
              <a href="#student-dashboard" className="pill-link">Xem dashboard</a>
            ) : (
              <button type="button" className="pill-button" onClick={onLogin}>Bắt đầu</button>
            )}
            <a href="#workflow" className="text-link">Xem luồng chính</a>
          </div>
        </div>

        <div className="home-showcase" aria-label="CareerMap overview">
          <div className="showcase-header">
            <span>Roadmap progress</span>
            <strong>{isStudent ? '68%' : 'Skill-first'}</strong>
          </div>
          <div className="roadmap-preview">
            <span className="done">Career role</span>
            <span className="done">Skill gap</span>
            <span>Learning nodes</span>
            <span>Portfolio review</span>
          </div>
        </div>
      </section>

      <section id="workflow" className="home-band dark">
        <div className="home-section-header">
          <p className="eyebrow">Main workflow</p>
          <h2>5 luồng chính của CareerMap</h2>
        </div>
        <div className="workflow-grid">
          <WorkflowCard title="Chọn career role" text="Sinh viên chọn mục tiêu nghề nghiệp để hệ thống biết cần so skill nào." />
          <WorkflowCard title="Phân tích skill gap" text="AI và dữ liệu requirement xác định kỹ năng thiếu so với role đã chọn." />
          <WorkflowCard title="Sinh roadmap" text="Roadmap chia thành từng node học tập, mỗi node gắn tài liệu hoặc link." />
          <WorkflowCard title="Xây portfolio" text="Sinh viên publish portfolio và cập nhật GitHub/project evidence." />
          <WorkflowCard title="Mentor review" text="Mentor đánh giá portfolio, technical skill và job readiness." />
        </div>
      </section>

      <section id="student-dashboard" className="home-band">
        <div className="home-section-header">
          <p className="eyebrow">{isStudent ? 'Your dashboard' : 'Student view'}</p>
          <h2>{isStudent ? `Xin chào, ${session.user.fullName}` : 'Sinh viên xem được gì sau khi đăng nhập'}</h2>
        </div>
        <div className="student-dashboard-grid">
          <StudentTile label="Target role" value={isStudent ? 'Frontend Developer' : 'Chọn role'} />
          <StudentTile label="Roadmap" value={isStudent ? '4/7 nodes' : 'Node + tài liệu'} />
          <StudentTile label="Resources" value="File / Link" />
          <StudentTile label="Mentor reviews" value={isStudent ? '2 lượt free' : 'Theo gói'} />
        </div>
      </section>

      <section id="pricing" className="home-band pricing-band">
        <div className="home-section-header">
          <p className="eyebrow">Subscription</p>
          <h2>Mua gói mentor review</h2>
          {activeSubscription && (
            <p className="subscription-note">
              Gói hiện tại: {activeSubscription.planName} · {activeSubscription.status}
              {activeSubscription.expiredAt ? ` · hết hạn ${formatDate(activeSubscription.expiredAt)}` : ''}
            </p>
          )}
        </div>

        {paymentMessage && <div className="success">{paymentMessage}</div>}
        {paymentError && <div className="alert">{paymentError}</div>}
        {plansStatus === 'loading' && <div className="state-card">Đang tải danh sách gói...</div>}

        <div className="pricing-grid">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isActive={activeSubscription?.planId === plan.id}
              isLoading={checkoutPlanId === plan.id}
              onBuy={() => buyPlan(plan)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function WorkflowCard({ title, text }) {
  return (
    <article className="workflow-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function StudentTile({ label, value }) {
  return (
    <article className="student-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PricingCard({ plan, isActive, isLoading, onBuy }) {
  const details = parsePlanFeatures(plan.featuresJson);
  const isFree = Number(plan.price) === 0;

  return (
    <article className={`pricing-card ${isActive ? 'current' : ''}`}>
      <div>
        <span className="pricing-kicker">{plan.billingCycle}</span>
        <h3>{plan.name}</h3>
        <p>{plan.description || 'Gói học tập và mentor review cho sinh viên CareerMap.'}</p>
      </div>

      <div className="price-line">
        <strong>{formatMoney(plan.price, plan.currency)}</strong>
        <span>{isFree ? 'Kích hoạt ngay' : 'Thanh toán qua PayOS'}</span>
      </div>

      <ul className="pricing-features">
        <li>{details.mentorReviewLimit} lượt mentor review</li>
        {(details.features || []).slice(0, 4).map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <button type="button" className="primary-action" onClick={onBuy} disabled={isLoading || isActive}>
        {isActive ? 'Đang sử dụng' : isLoading ? 'Đang xử lý...' : isFree ? 'Kích hoạt Free' : 'Mua gói'}
      </button>
    </article>
  );
}
