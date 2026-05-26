import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../subscriptions/subscriptionApi';
import { formatMoney } from '../../shared/format';
import { TypingText } from '../../components/animate-ui/primitives/texts/typing';
import { CountingNumber } from '../../components/animate-ui/primitives/texts/counting-number';
import '../../styles/home.css';

/* ────────────────────────────────────────────────────────────
   CareerMap — landing page
   - 100% Tiếng Việt
   - Không hình ảnh raster (chỉ CSS + SVG)
   - Hiệu ứng cuộn dùng motion (whileInView + useScroll + useTransform)
   - TypingText (animate-ui) cho tiêu đề hero
   ──────────────────────────────────────────────────────────── */

const cardVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const staggerParent = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function HomePage({ session, onLogin, onStart, onSignOut, onOpenDashboard }) {
  const isLoggedIn = Boolean(session);
  const onStartFn = onStart || onLogin; // fallback so component still works if onStart not provided
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [checkoutPlanId, setCheckoutPlanId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Scroll-linked top progress bar
  // https://motion.dev/docs/react-scroll-animations#scroll-linked-animations
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    mass: 0.4,
  });

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
      {/* Scroll-linked progress bar fixed at the top of the viewport */}
      <motion.div
        className="hp-scroll-progress"
        style={{ scaleX: progressScaleX }}
        aria-hidden
      />

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
              {onOpenDashboard ? (
                <button type="button" className="hp-nav-pill" onClick={onOpenDashboard}>Dashboard</button>
              ) : null}
              <button type="button" className="hp-nav-link-btn" onClick={onSignOut}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button type="button" className="hp-nav-link-btn" onClick={onLogin}>Đăng nhập</button>
              <button type="button" className="hp-nav-pill" onClick={onStartFn}>Bắt đầu</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <HeroSection onStart={onStartFn} />

      {/* ── PROCESS (DARK) ─────────────────────────────── */}
      <Section className="hp-tile hp-tile-dark" id="process">
        <ParallaxOrb className="hp-orb hp-orb-blue"
          style={{ width: 480, height: 480, top: -180, right: '-10%' }} />
        <div className="hp-tile-inner">
          <Eyebrow>Quy trình</Eyebrow>
          <RevealHeading as="h2">
            Bốn bước từ <em>điểm xuất phát</em> đến vai trò mơ ước.
          </RevealHeading>
          <RevealParagraph className="hp-tile-body">
            Mỗi bước có dữ liệu rõ ràng để bạn không phải đoán. Bạn biết chính xác mình đang ở đâu và nên học gì tiếp theo.
          </RevealParagraph>

          <motion.div
            className="hp-process"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <ProcessCard num="01" title="Chọn mục tiêu"
              desc="Lựa chọn vai trò bạn nhắm đến — Backend, Data, Mobile, Cloud — và mức độ kinh nghiệm hiện tại." />
            <ProcessCard num="02" title="AI phân tích"
              desc="Hệ thống đối chiếu kỹ năng của bạn với yêu cầu thị trường, chỉ ra khoảng cách và mức độ ưu tiên." />
            <ProcessCard num="03" title="Học theo lộ trình"
              desc="Mỗi node là một kỹ năng đi kèm tài liệu, dự án mẫu và checklist hoàn thành." />
            <ProcessCard num="04" title="Nhận đánh giá"
              desc="Gửi portfolio cho mentor đang làm việc thực tế. Phản hồi sâu, có thể hành động trong 48 giờ." />
          </motion.div>
        </div>
      </Section>

      {/* ── FEATURES (LIGHT) ───────────────────────────── */}
      <Section className="hp-tile hp-tile-light" id="features">
        <div className="hp-tile-inner">
          <Eyebrow>Tính năng nổi bật</Eyebrow>
          <RevealHeading as="h2">
            Mọi công cụ bạn cần. <em>Không phân mảnh.</em>
          </RevealHeading>
          <RevealParagraph className="hp-tile-body">
            Thay vì chuyển đổi giữa năm sáu công cụ, CareerMap gộp toàn bộ hành trình vào một trải nghiệm liền mạch.
          </RevealParagraph>

          <motion.div
            className="hp-feature-grid"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <FeatureCard icon={<IconChart />} title="Skill Gap Analysis"
              desc="Đo khoảng cách giữa kỹ năng hiện tại và yêu cầu của vai trò mục tiêu, theo dữ liệu thị trường gần nhất." />
            <FeatureCard icon={<IconRoute />} title="Lộ trình cá nhân hoá"
              desc="Sinh tự động bản đồ học tập theo từng tuần, ưu tiên kỹ năng quan trọng và tiết kiệm thời gian." />
            <FeatureCard icon={<IconChat />}  title="Mentor Review"
              desc="Gửi bài tập, dự án và CV để nhận phản hồi cụ thể từ mentor đang làm việc tại các công ty hàng đầu." />
            <FeatureCard icon={<IconDocs />}  title="Thư viện tài nguyên"
              desc="Bài viết, video và tài liệu được tuyển chọn cho từng kỹ năng — luôn cập nhật, luôn đúng trọng tâm." />
            <FeatureCard icon={<IconCheck />} title="Theo dõi tiến độ"
              desc="Dashboard hiển thị tiến độ từng node, thời gian học và những kỹ năng bạn đã thông thạo." />
            <FeatureCard icon={<IconShield />} title="Career Counselor"
              desc="Khi cần một góc nhìn sâu hơn, đội ngũ tư vấn học thuật sẵn sàng đồng hành theo từng giai đoạn." />
          </motion.div>
        </div>
      </Section>

      {/* ── PRICING (PARCHMENT) — moved up so the offer is visible early ── */}
      <Section className="hp-tile hp-tile-parchment" id="pricing">
        <div className="hp-tile-inner">
          <Eyebrow>Gói dịch vụ</Eyebrow>
          <RevealHeading as="h2">
            Đầu tư <em>vào chính bạn.</em>
          </RevealHeading>
          <RevealParagraph className="hp-tile-body">
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm lượt review hoặc tính năng nâng cao.
          </RevealParagraph>

          {errorMessage && <span className="hp-notice error">{errorMessage}</span>}

          <motion.div
            className="hp-pricing-grid"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {plans.map((plan) => {
              const details    = parsePlanFeatures(plan.featuresJson);
              const isFree     = Number(plan.price) === 0;
              const isLoading  = checkoutPlanId === plan.id;
              const isOwned    = activePlanIds.has(plan.id);
              const isFeatured = plan.name?.toLowerCase().includes('pro');

              return (
                <motion.article
                  key={plan.id}
                  className={`hp-pricing-card${isFeatured ? ' featured' : ''}`}
                  variants={cardVariants}
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
                </motion.article>
              );
            })}

            {plans.length === 0 && (
              <motion.article className="hp-pricing-card" variants={cardVariants}>
                <h3>Đang cập nhật</h3>
                <p>Gói dịch vụ sẽ sớm được công bố. Hãy quay lại sau hoặc liên hệ với đội ngũ CareerMap.</p>
              </motion.article>
            )}
          </motion.div>
        </div>
      </Section>

      {/* ── PERSONA (LIGHT) — moved below pricing ─────── */}
      <Section className="hp-tile hp-tile-light" id="network">
        <div className="hp-tile-inner">
          <Eyebrow>Dành cho ai</Eyebrow>
          <RevealHeading as="h2">
            Một nền tảng. <em>Hai chiều giá trị.</em>
          </RevealHeading>
          <RevealParagraph className="hp-tile-body">
            CareerMap phục vụ cả người học và mạng lưới chuyên gia, tạo nên một vòng tròn khép kín giữa đào tạo và thực hành.
          </RevealParagraph>

          <motion.div
            className="hp-persona-grid"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.article className="hp-persona" variants={cardVariants}>
              <span className="hp-persona-tag">Học viên</span>
              <h3>Tăng tốc sự nghiệp với dữ liệu, không phỏng đoán.</h3>
              <p>Phù hợp với sinh viên năm cuối, người đang chuyển ngành và developer muốn lên cấp độ tiếp theo.</p>
              <ul>
                <li>Lộ trình rõ ràng theo vai trò mục tiêu</li>
                <li>Phản hồi từ người đã đi trước, không phải lý thuyết</li>
                <li>Theo dõi tiến độ và năng suất hằng tuần</li>
              </ul>
            </motion.article>

            <motion.article className="hp-persona" variants={cardVariants}>
              <span className="hp-persona-tag">Mentor &amp; Counselor</span>
              <h3>Truyền lại kinh nghiệm. Tạo ảnh hưởng có thể đo lường.</h3>
              <p>Cộng đồng mentor đến từ Big Tech, startup và các công ty sản phẩm đang phát triển nhanh.</p>
              <ul>
                <li>Lịch review linh hoạt, kiểm soát khối lượng</li>
                <li>Hồ sơ học viên rõ ràng, có dữ liệu kỹ năng</li>
                <li>Hệ thống ghi nhận đóng góp minh bạch</li>
              </ul>
            </motion.article>
          </motion.div>
        </div>
      </Section>

      {/* ── STATS RIBBON — moved here so social proof lands right before FAQ/CTA ── */}
      <Section className="hp-tile hp-tile-parchment">
        <div className="hp-tile-inner">
          <motion.div
            className="hp-stats"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <StatCard value={10}  suffix="K+" label="Học viên đang theo lộ trình" />
            <StatCard value={120} suffix="+"  label="Mentor từ Big Tech & Startup" />
            <StatCard value={96}  suffix="%"  label="Học viên đạt mục tiêu kỹ năng" />
            <StatCard value={48}  suffix="h"  label="Thời gian phản hồi từ mentor" />
          </motion.div>
        </div>
      </Section>

      {/* ── FAQ (DEEP) ─────────────────────────────────── */}
      <Section className="hp-tile hp-tile-deep" id="faq">
        <ParallaxOrb className="hp-orb hp-orb-purple"
          style={{ width: 380, height: 380, top: -100, left: '60%' }} />
        <div className="hp-tile-inner">
          <Eyebrow>Hỏi &amp; Đáp</Eyebrow>
          <RevealHeading as="h2">Vài điều bạn có thể đang băn khoăn.</RevealHeading>

          <motion.div
            className="hp-faq"
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.details className="hp-faq-item" variants={cardVariants}>
              <summary>Tôi mất bao lâu để hoàn thành một lộ trình?</summary>
              <p>Phụ thuộc vào nền tảng hiện tại và cường độ học. Trung bình mỗi học viên hoàn thành lộ trình junior trong 4–6 tháng nếu duy trì 8–10 giờ/tuần.</p>
            </motion.details>
            <motion.details className="hp-faq-item" variants={cardVariants}>
              <summary>AI dựa vào dữ liệu nào để đề xuất kỹ năng?</summary>
              <p>Hệ thống tổng hợp mô tả công việc thực tế và yêu cầu được mentor xác nhận. Mọi đề xuất đều có thể tuỳ chỉnh thủ công.</p>
            </motion.details>
            <motion.details className="hp-faq-item" variants={cardVariants}>
              <summary>Tôi có thể đổi mục tiêu giữa chừng không?</summary>
              <p>Có. Bạn đổi vai trò mục tiêu bất cứ lúc nào — hệ thống sẽ giữ lại các kỹ năng đã hoàn thành phù hợp và cập nhật phần còn lại.</p>
            </motion.details>
            <motion.details className="hp-faq-item" variants={cardVariants}>
              <summary>Mentor có phải nhân viên CareerMap không?</summary>
              <p>Không. Mentor là chuyên gia đang làm việc tại các công ty công nghệ. Họ phải qua quy trình xét duyệt và được đánh giá liên tục bởi học viên.</p>
            </motion.details>
            <motion.details className="hp-faq-item" variants={cardVariants}>
              <summary>Nếu tôi huỷ gói thì sao?</summary>
              <p>Bạn vẫn giữ quyền truy cập đến hết chu kỳ thanh toán. Lộ trình và tiến độ được lưu để bạn có thể tiếp tục bất cứ khi nào.</p>
            </motion.details>
          </motion.div>
        </div>
      </Section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <Section className="hp-tile hp-tile-light">
        <div className="hp-tile-inner">
          <Eyebrow>Sẵn sàng?</Eyebrow>
          <RevealHeading as="h2">
            Bước đi đầu tiên là <em>bước đi quan trọng nhất.</em>
          </RevealHeading>
          <RevealParagraph className="hp-tile-lead">
            Tạo lộ trình của bạn ngay hôm nay. Hoàn toàn miễn phí, không cần thẻ thanh toán.
          </RevealParagraph>
          <motion.div
            className="hp-actions"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <button type="button" className="hp-btn-primary" onClick={onStartFn}>
              Bắt đầu ngay <span className="hp-btn-arrow" aria-hidden>→</span>
            </button>
            <a href="#pricing" className="hp-btn-ghost">Xem các gói dịch vụ</a>
          </motion.div>
        </div>
      </Section>

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
   HERO — typing title + scroll-linked parallax on roadmap mock
   ──────────────────────────────────────────────────────────── */
const HERO_LINE_1 = 'Vẽ lộ trình sự nghiệp.';
const HERO_LINE_2 = 'Chinh phục từng cột mốc.';

function HeroSection({ onStart }) {
  const ref = useRef(null);
  // Scroll-linked animations
  // https://motion.dev/docs/react-scroll-animations#scroll-linked-animations
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const mockY       = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const mockOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const mockScale   = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const orbBlueY    = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const orbPurpleY  = useTransform(scrollYProgress, [0, 1], [0, 220]);

  return (
    <section ref={ref} className="hp-tile hp-tile-light hp-hero" id="hero">
      <motion.span
        className="hp-orb hp-orb-blue"
        style={{ width: 360, height: 360, top: -120, left: '12%', y: orbBlueY }}
      />
      <motion.span
        className="hp-orb hp-orb-purple"
        style={{ width: 320, height: 320, top: 80, right: '8%', y: orbPurpleY }}
      />

      <div className="hp-tile-inner">
        <motion.span
          className="hp-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          Định hướng nghề nghiệp
        </motion.span>

        <motion.h1
          className="hp-hero-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
        >
          <TypingText
            as="span"
            className="hp-hero-typing"
            text={HERO_LINE_1}
            duration={38}
            delay={150}
          />
          <br />
          <em className="hp-hero-em">
            <TypingText
              as="span"
              text={HERO_LINE_2}
              duration={38}
              delay={150 + HERO_LINE_1.length * 38 + 150}
              cursor
            />
          </em>
        </motion.h1>

        <motion.p
          className="hp-tile-lead"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.25 }}
        >
          CareerMap kết hợp AI và mạng lưới chuyên gia để biến mục tiêu nghề nghiệp của bạn thành hành trình rõ ràng, đo lường được.
        </motion.p>

        <motion.p
          className="hp-tile-body"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.4 }}
        >
          Phân tích kỹ năng, sinh lộ trình học, nhận đánh giá portfolio từ mentor đang làm việc tại các công ty công nghệ — tất cả ở một nền tảng duy nhất.
        </motion.p>

        <motion.div
          className="hp-actions"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.55 }}
        >
          <button type="button" className="hp-btn-primary" onClick={onStart}>
            Bắt đầu miễn phí <span className="hp-btn-arrow" aria-hidden>→</span>
          </button>
          <a href="#process" className="hp-btn-ghost">
            Xem cách hoạt động <span className="hp-btn-arrow" aria-hidden>↓</span>
          </a>
        </motion.div>

        <motion.div
          className="hp-hero-mock-wrap"
          style={{ y: mockY, opacity: mockOpacity, scale: mockScale }}
        >
          <RoadmapMock />
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   Section wrapper — fades + lifts when entering the viewport
   (https://motion.dev/docs/react-scroll-animations)
   ──────────────────────────────────────────────────────────── */
function Section({ className = '', children, id }) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function RevealHeading({ children }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {children}
    </motion.h2>
  );
}

function RevealParagraph({ className = '', children }) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
    >
      {children}
    </motion.p>
  );
}

function Eyebrow({ children }) {
  return (
    <motion.span
      className="hp-eyebrow"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.span>
  );
}

/* ────────────────────────────────────────────────────────────
   Scroll-linked floating orb (parallax)
   ──────────────────────────────────────────────────────────── */
function ParallaxOrb({ className, style }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80, -120]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ ...style, y }}
      aria-hidden
    />
  );
}

/* ────────────────────────────────────────────────────────────
   Cards — each is a motion component so it picks up the parent
   grid's `visible` variant + staggerChildren timing.
   ──────────────────────────────────────────────────────────── */
function ProcessCard({ num, title, desc }) {
  return (
    <motion.article className="hp-process-card" variants={cardVariants}>
      <span className="hp-process-num">{num}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.article>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.article className="hp-feature" variants={cardVariants}>
      <span className="hp-feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.article>
  );
}

function StatCard({ value, suffix, label }) {
  return (
    <motion.div className="hp-stat" variants={cardVariants}>
      <strong>
        <CountingNumber
          as="b"
          number={value}
          inView
          delay={150}
          style={{ fontWeight: 'inherit', display: 'inline' }}
        />
        {suffix}
      </strong>
      <span>{label}</span>
    </motion.div>
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
   Inline icons
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
