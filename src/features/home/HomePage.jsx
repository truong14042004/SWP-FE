import { useEffect, useRef, useState } from 'react';
import {
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../subscriptions/subscriptionApi';
import { formatMoney } from '../../shared/format';
import '../../styles/home.css';

/* ────────────────────────────────────────────────────────────
   CareerMap — landing page
   - 100% Tiếng Việt
   - Không hình ảnh raster (chỉ CSS + SVG)
   - Animate khi scroll qua từng section (Intersection Observer)
   ──────────────────────────────────────────────────────────── */

export function HomePage({ session, onLogin, onSignOut }) {
  const isLoggedIn = Boolean(session);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [checkoutPlanId, setCheckoutPlanId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => { loadPlans(); /* eslint-disable-next-line */ }, [session?.token]);

  async function loadPlans() {
    try {
      const [planList, subList] = await Promise.all([
        getSubscriptionPlans(),
        session ? getMySubscriptions(session).catch(() => []) : Promise.resolve([]),
      ]);
      setPlans(planList);
      setSubscriptions(subList);
    } catch (error) {
      console.error(error);
    }
  }

  async function buyPlan(plan) {
    if (!session) { onLogin(); return; }
    setErrorMessage('');
    setCheckoutPlanId(plan.id);
    try {
      const checkout = await createSubscriptionCheckout(session, plan.id);
      if (checkout.checkoutUrl) {
        window.location.assign(checkout.checkoutUrl);
      } else {
        await loadPlans();
      }
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tạo phiên thanh toán.');
    } finally {
      setCheckoutPlanId('');
    }
  }

  const activePlanIds = new Set(
    subscriptions
      .filter((sub) => sub.status === 'Active')
      .map((sub) => sub.planId),
  );

  return (
    <div className="hp-shell">
      {/* ── GLOBAL NAV ─────────────────────────────────── */}
      <nav className="hp-nav" aria-label="Điều hướng chính">
        <a href="#hero" className="hp-nav-brand">
          <span className="hp-nav-mark">CM</span>
          CareerMap
        </a>

        <ul className="hp-nav-links">
          <li><a href="#process">Quy trình</a></li>
          <li><a href="#features">Tính năng</a></li>
          <li><a href="#network">Mạng lưới</a></li>
          <li><a href="#pricing">Đăng ký</a></li>
          <li><a href="#faq">Hỏi đáp</a></li>
        </ul>

        <div className="hp-nav-cta">
          {isLoggedIn ? (
            <>
              <span className="hp-nav-link-btn" aria-hidden>{session?.user?.fullName}</span>
              <button type="button" className="hp-nav-pill" onClick={onSignOut}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button type="button" className="hp-nav-link-btn" onClick={onLogin}>Đăng nhập</button>
              <button type="button" className="hp-nav-pill" onClick={onLogin}>Bắt đầu</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-light" id="hero">
        <span className="hp-orb hp-orb-blue"
              style={{ width: 360, height: 360, top: -120, left: '12%' }} />
        <span className="hp-orb hp-orb-purple"
              style={{ width: 320, height: 320, top: 80, right: '8%' }} />

        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Định hướng nghề nghiệp</span>
          <h1>
            Vẽ <em>lộ trình</em> sự nghiệp.<br />
            Chinh phục từng cột mốc.
          </h1>
          <p className="hp-tile-lead">
            CareerMap kết hợp AI và mạng lưới chuyên gia để biến mục tiêu nghề nghiệp của bạn thành hành trình rõ ràng, đo lường được.
          </p>
          <p className="hp-tile-body">
            Phân tích kỹ năng, sinh lộ trình học, nhận đánh giá portfolio từ mentor đang làm việc tại các công ty công nghệ — tất cả ở một nền tảng duy nhất.
          </p>

          <div className="hp-actions">
            <button type="button" className="hp-btn-primary" onClick={onLogin}>
              Bắt đầu miễn phí <span className="hp-btn-arrow" aria-hidden>→</span>
            </button>
            <a href="#process" className="hp-btn-ghost">
              Xem cách hoạt động <span className="hp-btn-arrow" aria-hidden>↓</span>
            </a>
          </div>

          <RoadmapMock />
        </div>
      </Reveal>

      {/* ── STATS RIBBON ───────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-parchment">
        <div className="hp-tile-inner">
          <div className="hp-stats hp-reveal-stagger" data-stagger>
            <div className="hp-stat">
              <strong>10K+</strong>
              <span>Học viên đang theo lộ trình</span>
            </div>
            <div className="hp-stat">
              <strong>120+</strong>
              <span>Mentor từ Big Tech &amp; Startup</span>
            </div>
            <div className="hp-stat">
              <strong>96%</strong>
              <span>Học viên đạt mục tiêu kỹ năng</span>
            </div>
            <div className="hp-stat">
              <strong>48h</strong>
              <span>Thời gian phản hồi từ mentor</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── PROCESS (DARK) ─────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-dark" id="process">
        <span className="hp-orb hp-orb-blue"
              style={{ width: 480, height: 480, top: -180, right: '-10%' }} />
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Quy trình</span>
          <h2>Bốn bước từ <em>điểm xuất phát</em> đến vai trò mơ ước.</h2>
          <p className="hp-tile-body">
            Mỗi bước đều có dữ liệu rõ ràng để bạn không phải đoán. Bạn biết chính xác mình đang ở đâu và nên học gì tiếp theo.
          </p>

          <div className="hp-process hp-reveal-stagger" data-stagger>
            <article className="hp-process-card">
              <span className="hp-process-num">01</span>
              <h3>Chọn mục tiêu</h3>
              <p>Lựa chọn vai trò bạn nhắm đến — Backend, Data, Mobile, Cloud — và mức độ kinh nghiệm hiện tại.</p>
            </article>
            <article className="hp-process-card">
              <span className="hp-process-num">02</span>
              <h3>AI phân tích</h3>
              <p>Hệ thống đối chiếu kỹ năng của bạn với yêu cầu thị trường, chỉ ra khoảng cách và mức độ ưu tiên.</p>
            </article>
            <article className="hp-process-card">
              <span className="hp-process-num">03</span>
              <h3>Học theo lộ trình</h3>
              <p>Mỗi node là một kỹ năng đi kèm tài liệu, dự án mẫu và checklist hoàn thành.</p>
            </article>
            <article className="hp-process-card">
              <span className="hp-process-num">04</span>
              <h3>Nhận đánh giá</h3>
              <p>Gửi portfolio cho mentor đang làm việc thực tế. Phản hồi sâu, có thể hành động được trong 48 giờ.</p>
            </article>
          </div>
        </div>
      </Reveal>

      {/* ── FEATURES (LIGHT) ───────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-light" id="features">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Tính năng nổi bật</span>
          <h2>Mọi công cụ bạn cần. <em>Không phân mảnh.</em></h2>
          <p className="hp-tile-body">
            Thay vì chuyển đổi giữa năm sáu công cụ, CareerMap gộp toàn bộ hành trình vào một trải nghiệm liền mạch.
          </p>

          <div className="hp-feature-grid hp-reveal-stagger" data-stagger>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconChart /></span>
              <h3>Skill Gap Analysis</h3>
              <p>Đo khoảng cách giữa kỹ năng hiện tại và yêu cầu của vai trò mục tiêu, theo đúng dữ liệu thị trường gần nhất.</p>
            </article>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconRoute /></span>
              <h3>Lộ trình cá nhân hoá</h3>
              <p>Sinh tự động bản đồ học tập theo từng tuần, ưu tiên kỹ năng quan trọng và tiết kiệm thời gian nhất.</p>
            </article>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconChat /></span>
              <h3>Mentor Review</h3>
              <p>Gửi bài tập, dự án và CV để nhận phản hồi cụ thể từ mentor đang làm việc tại các công ty hàng đầu.</p>
            </article>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconDocs /></span>
              <h3>Thư viện tài nguyên</h3>
              <p>Bài viết, video và tài liệu được tuyển chọn cho từng kỹ năng — luôn cập nhật, luôn đúng trọng tâm.</p>
            </article>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconCheck /></span>
              <h3>Theo dõi tiến độ</h3>
              <p>Dashboard hiển thị tiến độ từng node, thời gian học và những kỹ năng bạn đã thông thạo.</p>
            </article>
            <article className="hp-feature">
              <span className="hp-feature-icon"><IconShield /></span>
              <h3>Career Counselor</h3>
              <p>Khi bạn cần một góc nhìn sâu hơn, đội ngũ tư vấn học thuật sẵn sàng đồng hành theo từng giai đoạn.</p>
            </article>
          </div>
        </div>
      </Reveal>

      {/* ── PERSONA (PARCHMENT) ────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-parchment" id="network">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Dành cho ai</span>
          <h2>Một nền tảng. <em>Hai chiều giá trị.</em></h2>
          <p className="hp-tile-body">
            CareerMap phục vụ cả người học và mạng lưới chuyên gia, tạo nên một vòng tròn khép kín giữa đào tạo và thực hành.
          </p>

          <div className="hp-persona-grid hp-reveal-stagger" data-stagger>
            <article className="hp-persona">
              <span className="hp-persona-tag">Học viên</span>
              <h3>Tăng tốc sự nghiệp với dữ liệu, không phỏng đoán.</h3>
              <p>Phù hợp với sinh viên năm cuối, người đang chuyển ngành và developer muốn lên cấp độ tiếp theo.</p>
              <ul>
                <li>Lộ trình rõ ràng theo vai trò mục tiêu</li>
                <li>Phản hồi từ người đã đi trước, không phải lý thuyết</li>
                <li>Theo dõi tiến độ và năng suất hằng tuần</li>
              </ul>
            </article>

            <article className="hp-persona">
              <span className="hp-persona-tag">Mentor &amp; Counselor</span>
              <h3>Truyền lại kinh nghiệm. Tạo ảnh hưởng có thể đo lường.</h3>
              <p>Cộng đồng mentor đến từ Big Tech, startup và các công ty sản phẩm đang phát triển nhanh.</p>
              <ul>
                <li>Lịch review linh hoạt, kiểm soát khối lượng</li>
                <li>Hồ sơ học viên rõ ràng, có dữ liệu kỹ năng</li>
                <li>Hệ thống ghi nhận đóng góp minh bạch</li>
              </ul>
            </article>
          </div>
        </div>
      </Reveal>

      {/* ── PRICING (LIGHT) ────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-light" id="pricing">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Gói dịch vụ</span>
          <h2>Đầu tư <em>vào chính bạn.</em></h2>
          <p className="hp-tile-body">
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm lượt review hoặc tính năng nâng cao.
          </p>

          {errorMessage && <span className="hp-notice error">{errorMessage}</span>}

          <div className="hp-pricing-grid hp-reveal-stagger" data-stagger>
            {plans.map((plan) => {
              const details = parsePlanFeatures(plan.featuresJson);
              const isFree     = Number(plan.price) === 0;
              const isLoading  = checkoutPlanId === plan.id;
              const isOwned    = activePlanIds.has(plan.id);
              const isFeatured = plan.name?.toLowerCase().includes('pro');

              return (
                <article
                  key={plan.id}
                  className={`hp-pricing-card${isFeatured ? ' featured' : ''}`}
                >
                  {isFeatured && <span className="hp-pricing-tag">Phổ biến nhất</span>}

                  <header style={{ display: 'grid', gap: 8 }}>
                    <h3>{plan.name}</h3>
                    <div className="hp-pricing-price">
                      <strong>{formatMoney(plan.price, plan.currency)}</strong>
                      <span>/ {billingLabel(plan.billingCycle)}</span>
                    </div>
                  </header>

                  <p>{plan.description || 'Gói tiêu chuẩn để bạn nắm bắt cơ hội và rèn luyện những kỹ năng quan trọng nhất.'}</p>

                  <ul className="hp-pricing-features">
                    <li>{details.mentorReviewLimit || 0} lượt mentor review mỗi chu kỳ</li>
                    {(details.features || []).slice(0, 6).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  {isOwned ? (
                    <span className="hp-notice">Bạn đang dùng gói này</span>
                  ) : (
                    <button
                      type="button"
                      className="hp-btn-primary hp-pricing-cta"
                      onClick={() => buyPlan(plan)}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? 'Đang xử lý…'
                        : isFree
                          ? 'Dùng thử miễn phí'
                          : 'Chọn gói này'}
                      <span className="hp-btn-arrow" aria-hidden>→</span>
                    </button>
                  )}
                </article>
              );
            })}

            {plans.length === 0 && (
              <article className="hp-pricing-card">
                <h3>Đang cập nhật</h3>
                <p>Gói dịch vụ sẽ sớm được công bố. Hãy quay lại sau hoặc liên hệ với đội ngũ CareerMap.</p>
              </article>
            )}
          </div>
        </div>
      </Reveal>

      {/* ── FAQ (DEEP) ─────────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-deep" id="faq">
        <span className="hp-orb hp-orb-purple"
              style={{ width: 380, height: 380, top: -100, left: '60%' }} />
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Hỏi &amp; Đáp</span>
          <h2>Vài điều bạn có thể đang băn khoăn.</h2>

          <div className="hp-faq">
            <details className="hp-faq-item">
              <summary>Tôi mất bao lâu để hoàn thành một lộ trình?</summary>
              <p>Phụ thuộc vào nền tảng hiện tại và cường độ học. Trung bình mỗi học viên hoàn thành lộ trình junior trong 4–6 tháng nếu duy trì 8–10 giờ/tuần.</p>
            </details>
            <details className="hp-faq-item">
              <summary>AI dựa vào dữ liệu nào để đề xuất kỹ năng?</summary>
              <p>Hệ thống tổng hợp mô tả công việc thực tế và yêu cầu được mentor xác nhận. Mọi đề xuất đều có thể tuỳ chỉnh thủ công.</p>
            </details>
            <details className="hp-faq-item">
              <summary>Tôi có thể đổi mục tiêu giữa chừng không?</summary>
              <p>Có. Bạn đổi vai trò mục tiêu bất cứ lúc nào — hệ thống sẽ giữ lại các kỹ năng đã hoàn thành phù hợp và cập nhật phần còn lại.</p>
            </details>
            <details className="hp-faq-item">
              <summary>Mentor có phải nhân viên CareerMap không?</summary>
              <p>Không. Mentor là chuyên gia đang làm việc tại các công ty công nghệ. Họ phải qua quy trình xét duyệt và được đánh giá liên tục bởi học viên.</p>
            </details>
            <details className="hp-faq-item">
              <summary>Nếu tôi huỷ gói thì sao?</summary>
              <p>Bạn vẫn giữ quyền truy cập đến hết chu kỳ thanh toán. Lộ trình và tiến độ được lưu để bạn có thể tiếp tục bất cứ khi nào.</p>
            </details>
          </div>
        </div>
      </Reveal>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <Reveal as="section" className="hp-tile hp-tile-light">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Sẵn sàng?</span>
          <h2>Bước đi đầu tiên là <em>bước đi quan trọng nhất.</em></h2>
          <p className="hp-tile-lead">Tạo lộ trình của bạn ngay hôm nay. Hoàn toàn miễn phí, không cần thẻ thanh toán.</p>
          <div className="hp-actions">
            <button type="button" className="hp-btn-primary" onClick={onLogin}>
              Bắt đầu ngay <span className="hp-btn-arrow" aria-hidden>→</span>
            </button>
            <a href="#pricing" className="hp-btn-ghost">Xem các gói dịch vụ</a>
          </div>
        </div>
      </Reveal>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-cols">
            <div className="hp-footer-col">
              <h4>Sản phẩm</h4>
              <ul>
                <li><a href="#process">Quy trình</a></li>
                <li><a href="#features">Tính năng</a></li>
                <li><a href="#pricing">Gói dịch vụ</a></li>
                <li><a href="#network">Mạng lưới</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Tài nguyên</h4>
              <ul>
                <li><a href="#faq">Hỏi đáp</a></li>
                <li><a href="#">Hướng dẫn</a></li>
                <li><a href="#">Cộng đồng</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Công ty</h4>
              <ul>
                <li><a href="#">Về CareerMap</a></li>
                <li><a href="#">Tuyển dụng</a></li>
                <li><a href="#">Liên hệ</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Pháp lý</h4>
              <ul>
                <li><a href="#">Điều khoản</a></li>
                <li><a href="#">Bảo mật</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <span>© {new Date().getFullYear()} CareerMap. Bảo lưu mọi quyền.</span>
            <span>Việt Nam · v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Reveal — wraps a section, toggles `data-revealed` on scroll
   ──────────────────────────────────────────────────────────── */
function Reveal({ as: Tag = 'section', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setRevealed(true);

          // Stagger child grids individually so siblings reveal in order.
          node.querySelectorAll('[data-stagger]').forEach((child) => {
            child.setAttribute('data-revealed', 'true');
          });
          observer.disconnect();
        });
      },
      { threshold: 0.18 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <Tag
      ref={ref}
      className={`hp-reveal ${className}`}
      data-revealed={revealed ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────
   Roadmap mockup (used inside the hero, no images)
   ──────────────────────────────────────────────────────────── */
function RoadmapMock() {
  return (
    <div className="hp-hero-mock" aria-hidden="true">
      <header className="hp-hero-mock-head">
        <strong>Backend Developer · Junior → Mid</strong>
        <span>62% hoàn thành</span>
      </header>

      <div className="hp-hero-progress">
        <span className="hp-hero-progress-fill" />
      </div>

      <div className="hp-hero-steps">
        <div className="hp-hero-step done">
          <span className="dot" />
          <span>Nguyên tắc OOP &amp; SOLID</span>
          <span className="tag">Done</span>
        </div>
        <div className="hp-hero-step done">
          <span className="dot" />
          <span>REST API &amp; HTTP cơ bản</span>
          <span className="tag">Done</span>
        </div>
        <div className="hp-hero-step active">
          <span className="dot" />
          <span>Database design &amp; SQL nâng cao</span>
          <span className="tag">In progress</span>
        </div>
        <div className="hp-hero-step">
          <span className="dot" />
          <span>System design — patterns &amp; cache</span>
          <span className="tag">Up next</span>
        </div>
        <div className="hp-hero-step">
          <span className="dot" />
          <span>Mentor review portfolio</span>
          <span className="tag">Locked</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Inline icons (kept as small SVGs to avoid raster images)
   ──────────────────────────────────────────────────────────── */
function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 4 3 5-7" />
    </svg>
  );
}
function IconRoute() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v3a4 4 0 0 0 4 4h4" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />
    </svg>
  );
}
function IconDocs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function billingLabel(cycle) {
  switch ((cycle || '').toLowerCase()) {
    case 'monthly': return 'tháng';
    case 'yearly':  return 'năm';
    case 'free':    return 'miễn phí';
    default:        return cycle || 'chu kỳ';
  }
}
