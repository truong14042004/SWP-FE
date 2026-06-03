import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { GridScan } from '../../components/GridScan';
import { apiRequest } from '../../api/http';

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger);

/* ────────────────────────────────────────────────────────────
   3D Tilt Card Wrapper Component
   - Provides smooth 3D tilting on mouse move
   - Uses contextSafe to wrap dynamic GSAP handlers safely
   ──────────────────────────────────────────────────────────── */
function TiltCard({ children, className = '', ...props }) {
  const cardRef = useRef(null);
  const { contextSafe } = useGSAP({ scope: cardRef });

  const handleMouseMove = contextSafe((e) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateY = ((x - xc) / xc) * 12; // Max 12 deg
    const rotateX = -((y - yc) / yc) * 12; // Max 12 deg

    gsap.to(el, {
      rotateX,
      rotateY,
      scale: 1.03,
      boxShadow: '0 25px 50px -12px rgba(0, 102, 204, 0.35)',
      duration: 0.35,
      ease: 'power2.out',
      transformPerspective: 1000,
      overwrite: 'auto'
    });
  });

  const handleMouseLeave = contextSafe(() => {
    const el = cardRef.current;
    if (!el) return;

    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      boxShadow: 'none',
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
      {...props}
    >
      <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Scroll-linked Parallax Orb Component
   - Uses GSAP ScrollTrigger for 10x smoother parallax animation
   ──────────────────────────────────────────────────────────── */
function ParallaxOrb({ className, style }) {
  const orbRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(orbRef.current,
      { y: 80 },
      {
        y: -120,
        ease: 'none',
        scrollTrigger: {
          trigger: orbRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }, { scope: orbRef });

  return (
    <span
      ref={orbRef}
      className={className}
      style={style}
      aria-hidden
    />
  );
}

const apiUrl = import.meta.env.VITE_API_URL || '';

function resolveAvatarSrc(avatarUrl, userId) {
  if (!avatarUrl) return '';
  const trimmed = avatarUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/api/storage/public/')) return `${apiUrl}${trimmed}`;
  if (trimmed.startsWith('api/storage/public/')) return `${apiUrl}/${trimmed}`;
  return `${apiUrl}/api/storage/public/users/${userId}/avatar/download`;
}

export function HomePage({ session, onLogin, onStart, onSignOut, onOpenDashboard }) {
  const isLoggedIn = Boolean(session);
  const onStartFn = onStart || onLogin;
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [checkoutPlanId, setCheckoutPlanId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loadingMentors, setLoadingMentors] = useState(false);

  // Scroll-linked progress bar at the very top
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    mass: 0.4,
  });

  useEffect(() => {
    loadPlans();
    loadMentors();
  }, [session?.token]);

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

  async function loadMentors() {
    setLoadingMentors(true);
    try {
      const data = await apiRequest('/api/mentors');
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Không thể lấy danh sách mentor:', err);
    } finally {
      setLoadingMentors(false);
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

  // Global Page Reveal Animation with ScrollTrigger
  const shellRef = useRef(null);
  useGSAP(() => {
    // Fade and reveal all sections smoothly
    const sections = gsap.utils.toArray('.hp-tile');
    sections.forEach((sec) => {
      const inner = sec.querySelector('.hp-tile-inner');
      if (!inner) return;

      gsap.from(inner, {
        opacity: 0,
        y: 50,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    });

    // Stagger animation for process cards
    gsap.from('.hp-process-card', {
      opacity: 0,
      y: 35,
      scale: 0.95,
      stagger: 0.1,
      duration: 0.8,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '.hp-process',
        start: 'top 82%',
        once: true
      }
    });

    // Stagger animation for feature cards
    gsap.from('.hp-feature', {
      opacity: 0,
      y: 30,
      stagger: 0.08,
      duration: 0.85,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.hp-feature-grid',
        start: 'top 82%',
        once: true
      }
    });

    // Stagger animation for pricing cards
    gsap.from('.hp-pricing-card', {
      opacity: 0,
      y: 40,
      scale: 0.96,
      stagger: 0.12,
      duration: 0.9,
      ease: 'back.out(1.1)',
      scrollTrigger: {
        trigger: '.hp-pricing-grid',
        start: 'top 82%',
        once: true
      }
    });

    // Persona cards reveal
    gsap.from('.hp-persona', {
      opacity: 0,
      x: (i) => i === 0 ? -40 : 40,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.hp-persona-grid',
        start: 'top 82%',
        once: true
      }
    });

  }, { scope: shellRef });

  return (
    <div ref={shellRef} className="hp-shell">
      {/* Scroll-linked progress bar */}
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
      <section className="hp-tile hp-tile-dark" id="process">
        <ParallaxOrb className="hp-orb hp-orb-blue"
          style={{ width: 480, height: 480, top: -180, right: '-10%' }} />
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Quy trình</span>
          <h2>Bốn bước từ <em>điểm xuất phát</em> đến vai trò mơ ước.</h2>
          <p className="hp-tile-body">
            Mỗi bước có dữ liệu rõ ràng để bạn không phải đoán. Bạn biết chính xác mình đang ở đâu và nên học gì tiếp theo.
          </p>

          <div className="hp-process">
            <ProcessCard num="01" title="Chọn mục tiêu"
              desc="Lựa chọn vai trò bạn nhắm đến — Backend, Data, Mobile, Cloud — và mức độ kinh nghiệm hiện tại." />
            <ProcessCard num="02" title="AI phân tích"
              desc="Hệ thống đối chiếu kỹ năng của bạn với yêu cầu thị trường, chỉ ra khoảng cách và mức độ ưu tiên." />
            <ProcessCard num="03" title="Học theo lộ trình"
              desc="Mỗi node là một kỹ năng đi kèm tài liệu, dự án mẫu và checklist hoàn thành." />
            <ProcessCard num="04" title="Nhận đánh giá"
              desc="Gửi portfolio cho mentor đang làm việc thực tế. Phản hồi sâu, có thể hành động trong 48 giờ." />
          </div>
        </div>
      </section>

      {/* ── FEATURES (LIGHT) ───────────────────────────── */}
      <section className="hp-tile hp-tile-light" id="features">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Tính năng nổi bật</span>
          <h2>Mọi công cụ bạn cần. <em>Không phân mảnh.</em></h2>
          <p className="hp-tile-body">
            Thay vì chuyển đổi giữa năm sáu công cụ, CareerMap gộp toàn bộ hành trình vào một trải nghiệm liền mạch.
          </p>

          <div className="hp-feature-grid">
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
          </div>
        </div>
      </section>

      {/* ── PRICING (PARCHMENT) ── */}
      <section className="hp-tile hp-tile-parchment" id="pricing">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Gói dịch vụ</span>
          <h2>Đầu tư <em>vào chính bạn.</em></h2>
          <p className="hp-tile-body">
            Bắt đầu miễn phí, nâng cấp khi bạn cần thêm lượt review hoặc tính năng nâng cao.
          </p>

          {errorMessage && <span className="hp-notice error">{errorMessage}</span>}

          <div className="hp-pricing-grid">
            {plans.map((plan) => {
              const details    = parsePlanFeatures(plan.featuresJson);
              const isFree     = Number(plan.price) === 0;
              const isLoading  = checkoutPlanId === plan.id;
              const hasActivePaidPlan = plans.some(p => Number(p.price) > 0 && activePlanIds.has(p.id));
              const isOwned    = activePlanIds.has(plan.id) && !(isFree && hasActivePaidPlan);
              const isFeatured = plan.name?.toLowerCase().includes('pro');

              return (
                <TiltCard
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
                    <span className="hp-notice" style={{ marginTop: 'auto', textAlign: 'center' }}>Bạn đang dùng gói này</span>
                  ) : (
                    <button
                      type="button"
                      className="hp-btn-primary hp-pricing-cta"
                      onClick={() => buyPlan(plan)}
                      disabled={isLoading}
                      style={{ marginTop: 'auto' }}
                    >
                      {isLoading
                        ? 'Đang xử lý…'
                        : isFree
                          ? 'Dùng thử miễn phí'
                          : 'Chọn gói này'}
                      <span className="hp-btn-arrow" aria-hidden>→</span>
                    </button>
                  )}
                </TiltCard>
              );
            })}

            {plans.length === 0 && (
              <TiltCard className="hp-pricing-card">
                <h3>Đang cập nhật</h3>
                <p>Gói dịch vụ sẽ sớm được công bố. Hãy quay lại sau hoặc liên hệ với đội ngũ CareerMap.</p>
              </TiltCard>
            )}
          </div>
        </div>
      </section>

      {/* ── PERSONA (LIGHT) ─────── */}
      <section className="hp-tile hp-tile-light" id="network">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Dành cho ai</span>
          <h2>Một nền tảng. <em>Hai chiều giá trị.</em></h2>
          <p className="hp-tile-body">
            CareerMap phục vụ cả người học và mạng lưới chuyên gia, tạo nên một vòng tròn khép kín giữa đào tạo và thực hành.
          </p>

          <div className="hp-persona-grid">
            <TiltCard className="hp-persona">
              <span className="hp-persona-tag">Học viên</span>
              <h3>Tăng tốc sự nghiệp với dữ liệu, không phỏng đoán.</h3>
              <p>Phù hợp với sinh viên năm cuối, người đang chuyển ngành và developer muốn lên cấp độ tiếp theo.</p>
              <ul>
                <li>Lộ trình rõ ràng theo vai trò mục tiêu</li>
                <li>Phản hồi từ người đã đi trước, không phải lý thuyết</li>
                <li>Theo dõi tiến độ và năng suất hằng tuần</li>
              </ul>
            </TiltCard>

            <TiltCard className="hp-persona">
              <span className="hp-persona-tag">Mentor &amp; Counselor</span>
              <h3>Truyền lại kinh nghiệm. Tạo ảnh hưởng có thể đo lường.</h3>
              <p>Cộng đồng mentor đến từ Big Tech, startup và các công ty sản phẩm đang phát triển nhanh.</p>
              <ul>
                <li>Lịch review linh hoạt, kiểm soát khối lượng</li>
                <li>Hồ sơ học viên rõ ràng, có dữ liệu kỹ năng</li>
                <li>Hệ thống ghi nhận đóng góp minh bạch</li>
              </ul>
            </TiltCard>
          </div>

          <div style={{ marginTop: '72px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="hp-eyebrow" style={{ marginBottom: '12px' }}>Đội ngũ Chuyên gia</span>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: '600', fontFamily: 'var(--hp-font-display)', textAlign: 'center' }}>
              Kết nối trực tiếp với <em>Mentor &amp; Counselor</em>
            </h3>
            <p className="hp-tile-body" style={{ marginBottom: '36px', textAlign: 'center' }}>
              Những người đang làm việc tại các tập đoàn công nghệ hàng đầu và đội ngũ tư vấn giàu kinh nghiệm sẵn sàng hỗ trợ bạn.
            </p>

            {loadingMentors ? (
              <p style={{ color: 'var(--hp-ink-muted-48)' }}>Đang tải danh sách chuyên gia...</p>
            ) : mentors.length === 0 ? (
              <p style={{ color: 'var(--hp-ink-muted-48)' }}>Hiện chưa có mentor nào hoạt động.</p>
            ) : (
              <div className="hp-mentor-grid">
                {mentors.map((mentor) => {
                  const initials = (mentor.fullName || 'M')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const avatarSrc = resolveAvatarSrc(mentor.avatarUrl, mentor.id);

                  return (
                    <TiltCard
                      key={mentor.id}
                      className="hp-mentor-card"
                      onClick={() => setSelectedMentor(mentor)}
                    >
                      <div className="hp-mentor-avatar-wrap">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={mentor.fullName}
                            className="hp-mentor-avatar"
                          />
                        ) : (
                          <div className="hp-mentor-avatar-placeholder">{initials}</div>
                        )}
                      </div>

                      <span className={`hp-mentor-badge ${mentor.role === 'IndustryMentor' ? 'mentor' : 'counselor'}`}>
                        {mentor.role === 'IndustryMentor' ? 'Industry Mentor' : 'Counselor'}
                      </span>

                      <h3>{mentor.fullName}</h3>

                      <div className="hp-mentor-meta">
                        {mentor.profile?.jobTitle && mentor.profile?.company ? (
                          <div>{mentor.profile.jobTitle} tại {mentor.profile.company}</div>
                        ) : mentor.profile?.jobTitle ? (
                          <div>{mentor.profile.jobTitle}</div>
                        ) : mentor.profile?.company ? (
                          <div>Chuyên gia tại {mentor.profile.company}</div>
                        ) : (
                          <div>Chuyên gia công nghệ</div>
                        )}
                      </div>

                      {mentor.profile?.yearsOfExperience !== undefined && mentor.profile?.yearsOfExperience > 0 && (
                        <div className="hp-mentor-exp">
                          {mentor.profile.yearsOfExperience} năm kinh nghiệm
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="hp-mentor-stars">
                          ★ {mentor.stats?.averageRating ? mentor.stats.averageRating.toFixed(1) : '0.0'}
                          <span>({mentor.stats?.totalFeedbacksGiven || 0} reviews)</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--hp-primary)', fontWeight: '500' }}>Chi tiết →</span>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS RIBBON ── */}
      <section className="hp-tile hp-tile-parchment">
        <div className="hp-tile-inner">
          <div className="hp-stats">
            <StatCard value={10}  suffix="K+" label="Học viên đang theo lộ trình" />
            <StatCard value={120} suffix="+"  label="Mentor từ Big Tech & Startup" />
            <StatCard value={96}  suffix="%"  label="Học viên đạt mục tiêu kỹ năng" />
            <StatCard value={48}  suffix="h"  label="Thời gian phản hồi từ mentor" />
          </div>
        </div>
      </section>

      {/* ── FAQ (DEEP) ─────────────────────────────────── */}
      <section className="hp-tile hp-tile-deep" id="faq">
        <ParallaxOrb className="hp-orb hp-orb-purple"
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
      </section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section className="hp-tile hp-tile-light">
        <div className="hp-tile-inner">
          <span className="hp-eyebrow">Sẵn sàng?</span>
          <h2>Bước đi đầu tiên là <em>bước đi quan trọng nhất.</em></h2>
          <p className="hp-tile-lead">
            Tạo lộ trình của bạn ngay hôm nay. Hoàn toàn miễn phí, không cần thẻ thanh toán.
          </p>
          <div className="hp-actions">
            <button type="button" className="hp-btn-primary" onClick={onStartFn}>
              Bắt đầu ngay <span className="hp-btn-arrow" aria-hidden>→</span>
            </button>
            <a href="#pricing" className="hp-btn-ghost">Xem các gói dịch vụ</a>
          </div>
        </div>
      </section>

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

      {/* ── MENTOR DETAIL MODAL ─────────────────────────── */}
      <AnimatePresence>
        {selectedMentor && (
          <motion.div
            className="hp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMentor(null)}
          >
            <motion.div
              className="hp-modal-content"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="hp-modal-close"
                onClick={() => setSelectedMentor(null)}
                aria-label="Đóng"
              >
                ✕
              </button>

              <div className="hp-modal-body">
                <div className="hp-modal-left">
                  {resolveAvatarSrc(selectedMentor.avatarUrl, selectedMentor.id) ? (
                    <img
                      src={resolveAvatarSrc(selectedMentor.avatarUrl, selectedMentor.id)}
                      alt={selectedMentor.fullName}
                      className="hp-modal-avatar"
                    />
                  ) : (
                    <div className="hp-modal-avatar-placeholder">
                      {(selectedMentor.fullName || 'M')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  )}

                  <span className={`hp-mentor-badge ${selectedMentor.role === 'IndustryMentor' ? 'mentor' : 'counselor'}`}>
                    {selectedMentor.role === 'IndustryMentor' ? 'Industry Mentor' : 'Counselor'}
                  </span>

                  {selectedMentor.profile?.yearsOfExperience !== undefined && selectedMentor.profile?.yearsOfExperience > 0 && (
                    <span className="hp-mentor-exp" style={{ fontSize: '13px', marginTop: '4px' }}>
                      {selectedMentor.profile.yearsOfExperience} năm kinh nghiệm
                    </span>
                  )}
                </div>

                <div className="hp-modal-right">
                  <div className="hp-modal-title">
                    <h2>{selectedMentor.fullName}</h2>
                    <div style={{ color: 'var(--hp-ink-muted-80)', fontSize: '15px', fontWeight: '500' }}>
                      {selectedMentor.profile?.jobTitle && selectedMentor.profile?.company ? (
                        <span>{selectedMentor.profile.jobTitle} tại {selectedMentor.profile.company}</span>
                      ) : selectedMentor.profile?.jobTitle ? (
                        <span>{selectedMentor.profile.jobTitle}</span>
                      ) : selectedMentor.profile?.company ? (
                        <span>Chuyên gia tại {selectedMentor.profile.company}</span>
                      ) : (
                        <span>Chuyên gia công nghệ</span>
                      )}
                    </div>
                  </div>

                  <div className="hp-modal-stats">
                    <div className="hp-modal-stat-item">
                      <small>Sao đánh giá</small>
                      <strong style={{ color: '#f1c40f' }}>
                        ★ {selectedMentor.stats?.averageRating ? selectedMentor.stats.averageRating.toFixed(1) : '0.0'} / 5.0
                      </strong>
                    </div>
                    <div className="hp-modal-stat-item">
                      <small>Lượt review</small>
                      <strong>{selectedMentor.stats?.totalFeedbacksGiven || 0} feedbacks</strong>
                    </div>
                  </div>

                  {selectedMentor.profile?.linkedInUrl && (
                    <a
                      href={selectedMentor.profile.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hp-modal-linkedin"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      Xem trang LinkedIn
                    </a>
                  )}

                  <div style={{ borderTop: '1px solid var(--hp-divider-soft)', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', textTransform: 'uppercase', color: 'var(--hp-ink-muted-48)', letterSpacing: '0.5px' }}>
                      Giới thiệu
                    </h4>
                    <p className="hp-modal-bio">
                      {selectedMentor.profile?.bio || 'Chuyên gia chưa cập nhật thông tin giới thiệu.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   HERO — typing title + scroll-linked parallax on roadmap mock
   ──────────────────────────────────────────────────────────── */
const HERO_LINE_1 = 'Vẽ lộ trình sự nghiệp.';
const HERO_LINE_2 = 'Chinh phục từng cột mốc.';

function HeroSection({ onStart }) {
  const heroRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  useGSAP((context, contextSafe) => {
    // Parallax on scroll for background orbs
    gsap.to(orb1Ref.current, {
      y: -100,
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to(orb2Ref.current, {
      y: 150,
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // Dynamic bouncy & organic squishing animation for skill bubbles (soap/jelly bubble effect!)
    gsap.utils.toArray('.hp-skill-node').forEach((node, i) => {
      // 1. Organic drifting & bouncing movement
      gsap.to(node, {
        x: 'random(-60, 60)',
        y: 'random(-55, 55)',
        rotation: 'random(-12, 12)',
        duration: 'random(3, 4.5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.2
      });

      // 2. Liquid squash & stretch (squishy elastic bubble morphing!)
      gsap.to(node, {
        scaleX: 1.08,
        scaleY: 0.92,
        duration: 'random(1.2, 1.8)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.25
      });
    });

    // Mouse movement interactive drifting orbs & skill nodes parallax
    const onMouseMove = contextSafe((e) => {
      const { clientX, clientY } = e;
      const xPercent = (clientX / window.innerWidth - 0.5) * 45; // up to 45px
      const yPercent = (clientY / window.innerHeight - 0.5) * 45;

      gsap.to(orb1Ref.current, {
        x: xPercent,
        y: yPercent,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      gsap.to(orb2Ref.current, {
        x: -xPercent,
        y: -yPercent,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      // Interactive mouse push/pull on skill nodes for premium 3D Parallax feel!
      gsap.utils.toArray('.hp-skill-node').forEach((node, idx) => {
        const factor = (idx % 2 === 0 ? 1 : -1) * 35; // alternate directions for layered depth
        const mx = (clientX / window.innerWidth - 0.5) * factor;
        const my = (clientY / window.innerHeight - 0.5) * factor;

        gsap.to(node, {
          x: mx,
          y: my,
          duration: 1.4,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    });

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className="hp-tile hp-tile-light hp-hero" style={{ overflow: 'hidden' }} id="hero">
      <span
        ref={orb1Ref}
        className="hp-orb hp-orb-blue"
        style={{ width: 360, height: 360, top: -120, left: '12%' }}
      />
      <span
        ref={orb2Ref}
        className="hp-orb hp-orb-purple"
        style={{ width: 320, height: 320, top: 80, right: '8%' }}
      />

      <GridScan
        sensitivity={0.06}
        lineThickness={0.7}
        linesColor="#eef4fc"
        gridScale={0.22}
        scanColor="#0066cc"
        scanOpacity={0.15}
        enablePost={false}
        lineStyle="solid"
        lineJitter={0.0}
        scanDirection="pingpong"
        scanDuration={4.5}
        scanDelay={2.0}
        scanGlow={0.25}
        scanSoftness={1.5}
        enableGyro={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.85
        }}
      />

      {/* Premium floating skill nodes / constellation */}
      <div className="hp-constellation-container" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <div className="hp-skill-node" style={{ left: '12%', top: '22%', position: 'absolute' }}>
          <span className="node-dot" />
          React
        </div>
        <div className="hp-skill-node" style={{ left: '78%', top: '15%', position: 'absolute' }}>
          <span className="node-dot" />
          AWS
        </div>
        <div className="hp-skill-node" style={{ left: '16%', top: '75%', position: 'absolute' }}>
          <span className="node-dot" />
          Node.js
        </div>
        <div className="hp-skill-node" style={{ left: '76%', top: '78%', position: 'absolute' }}>
          <span className="node-dot" />
          Python
        </div>
        <div className="hp-skill-node" style={{ left: '85%', top: '48%', position: 'absolute' }}>
          <span className="node-dot" />
          AI Dev
        </div>
        <div className="hp-skill-node" style={{ left: '6%', top: '51%', position: 'absolute' }}>
          <span className="node-dot" />
          Docker
        </div>
        <div className="hp-skill-node" style={{ left: '46%', top: '15%', position: 'absolute' }}>
          <span className="node-dot" />
          System Design
        </div>
      </div>

      <div className="hp-tile-inner">
        <span className="hp-eyebrow">Định hướng nghề nghiệp</span>

        <h1 className="hp-hero-title">
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
        </h1>

        <p className="hp-tile-lead">
          CareerMap kết hợp AI và mạng lưới chuyên gia để biến mục tiêu nghề nghiệp của bạn thành hành trình rõ ràng, đo lường được.
        </p>

        <p className="hp-tile-body">
          Phân tích kỹ năng, sinh lộ trình học, nhận đánh giá portfolio từ mentor đang làm việc tại các công ty công nghệ — tất cả ở một nền tảng duy nhất.
        </p>

        <div className="hp-actions">
          <button type="button" className="hp-btn-primary" onClick={onStart}>
            Bắt đầu miễn phí <span className="hp-btn-arrow" aria-hidden>→</span>
          </button>
          <a href="#process" className="hp-btn-ghost">
            Xem cách hoạt động <span className="hp-btn-arrow" aria-hidden>↓</span>
          </a>
        </div>

        <div className="hp-hero-mock-wrap">
          <RoadmapMock />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   Cards Components — wrapped in TiltCard
   ──────────────────────────────────────────────────────────── */
function ProcessCard({ num, title, desc }) {
  return (
    <TiltCard className="hp-process-card">
      <span className="hp-process-num">{num}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </TiltCard>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <TiltCard className="hp-feature">
      <span className="hp-feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </TiltCard>
  );
}

function StatCard({ value, suffix, label }) {
  return (
    <div className="hp-stat">
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
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Roadmap Mockup with Premium GSAP Entrance & Pulse Animations
   ──────────────────────────────────────────────────────────── */
function RoadmapMock() {
  const mockRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: mockRef.current,
        start: 'top 85%',
        once: true
      }
    });

    // 1. Zoom and fade in the whole mockup wrapper
    tl.from(mockRef.current, {
      opacity: 0,
      y: 40,
      scale: 0.96,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 2. Animate the progress bar filling up smoothly
    tl.fromTo('.hp-hero-progress-fill',
      { width: '0%' },
      { width: '62%', duration: 1.4, ease: 'power2.inOut' },
      '-=0.4'
    );

    // 3. Stagger each roadmap step
    tl.from('.hp-hero-step', {
      opacity: 0,
      x: 30,
      stagger: 0.1,
      duration: 0.65,
      ease: 'power2.out'
    }, '-=0.9');

    // 4. Elastic scale-up for completed/active tags
    tl.from('.hp-hero-step.done .tag, .hp-hero-step.active .tag', {
      scale: 0,
      opacity: 0,
      duration: 0.45,
      ease: 'back.out(1.8)',
      stagger: 0.08
    }, '-=0.3');

  }, { scope: mockRef });

  return (
    <div ref={mockRef} className="hp-hero-mock" aria-hidden="true" style={{ transformStyle: 'preserve-3d' }}>
      <header className="hp-hero-mock-head">
        <strong>Backend Developer · Junior → Mid</strong>
        <span>62% hoàn thành</span>
      </header>

      <div className="hp-hero-progress">
        <span className="hp-hero-progress-fill" />
      </div>

      <div className="hp-hero-steps" style={{ transform: 'translateZ(10px)' }}>
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
