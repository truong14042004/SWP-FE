import { useEffect, useState } from 'react';
import {
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../subscriptions/subscriptionApi';
import { formatMoney } from '../../shared/format';
import '../../styles/home.css';

export function HomePage({ session, onLogin, onSignOut }) {
  const isLoggedIn = Boolean(session);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [checkoutPlanId, setCheckoutPlanId] = useState('');

  useEffect(() => { loadPlans(); }, [session?.token]);

  async function loadPlans() {
    try {
      const [planList, subList] = await Promise.all([
        getSubscriptionPlans(),
        session ? getMySubscriptions(session).catch(() => []) : Promise.resolve([]),
      ]);
      setPlans(planList); setSubscriptions(subList);
    } catch (err) { console.error(err); }
  }

  async function buyPlan(plan) {
    if (!session) { onLogin(); return; }
    setCheckoutPlanId(plan.id);
    try {
      const checkout = await createSubscriptionCheckout(session, plan.id);
      if (checkout.checkoutUrl) window.location.assign(checkout.checkoutUrl);
      else await loadPlans();
    } catch (err) { alert(err.message); }
    finally { setCheckoutPlanId(''); }
  }

  return (
    <div className="hp-root">
      {/* ── GLOBAL NAV ── */}
      <nav className="hp-global-nav">
        <a href="#" style={{ textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '15px' }}>
          CareerMap
        </a>
        <div className="hp-global-nav-links">
          <a href="#platform">Nền tảng</a>
          <a href="#features">Tính năng</a>
          <a href="#network">Mạng lưới</a>
          <a href="#store">Đăng ký</a>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {isLoggedIn ? (
            <button className="hp-dark-utility-btn" onClick={onSignOut}>Đăng xuất</button>
          ) : (
            <button className="hp-dark-utility-btn" onClick={onLogin}>Đăng nhập</button>
          )}
        </div>
      </nav>

      {/* ── TILE 1: LIGHT HERO ── */}
      <section className="hp-tile hp-tile-light" id="platform">
        <h1 className="hp-hero-display">CareerMap.</h1>
        <p className="hp-lead">Xác định điểm đến. Vẽ lối đi riêng.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#7a7a7a' }}>
          Nền tảng hướng nghiệp toàn diện kết hợp trí tuệ nhân tạo và mạng lưới chuyên gia. 
          Giúp bạn chuyển đổi từ người mới bắt đầu thành chuyên gia thực thụ.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-btn-primary">Bắt đầu miễn phí</a>
          <a href="#features" className="hp-text-link" style={{ alignSelf: 'center' }}>Khám phá quy trình &gt;</a>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80" 
          alt="CareerMap Dashboard" 
          className="hp-product-render"
          style={{ height: '500px', objectFit: 'cover', width: '1200px' }}
        />
      </section>

      {/* ── TILE 2: DARK TILE - AI ── */}
      <section className="hp-tile hp-tile-dark" id="features">
        <h2 className="hp-display-lg">AI Gap Analysis.</h2>
        <p className="hp-lead">Phát hiện lỗ hổng kỹ năng trong 30 giây.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#cccccc' }}>
          Thuật toán AI của chúng tôi phân tích CV của bạn, đối chiếu với hàng ngàn mô tả công việc thực tế trên thị trường, và chỉ ra chính xác những kỹ năng bạn còn thiếu. Không còn phỏng đoán, chỉ có dữ liệu.
        </p>
        <div className="hp-actions-row">
          <button onClick={onLogin} className="hp-btn-primary">Phân tích CV ngay</button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" 
          alt="AI Analysis" 
          className="hp-product-render"
          style={{ height: '400px', objectFit: 'cover', width: '900px' }}
        />
      </section>

      {/* ── TILE 3: PARCHMENT - ROADMAP ── */}
      <section className="hp-tile hp-tile-parchment">
        <h2 className="hp-display-lg">Lộ trình cá nhân hoá.</h2>
        <p className="hp-lead">Từng bước một, đến đúng mục tiêu.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#7a7a7a' }}>
          Dựa trên kết quả phân tích, hệ thống tự động sinh ra một bản đồ học tập (Learning Node) độc quyền. Mỗi Node cung cấp tài liệu, bài tập và dự án thực tế để bạn hoàn thiện mảnh ghép còn thiếu.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-text-link" style={{ alignSelf: 'center' }}>Xem ví dụ Roadmap &gt;</a>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" 
          alt="Roadmap Generation" 
          className="hp-product-render"
          style={{ height: '400px', objectFit: 'cover', width: '900px' }}
        />
      </section>

      {/* ── TILE 4: DARK TILE 2 - MENTORS ── */}
      <section className="hp-tile hp-tile-dark" style={{ background: '#2a2a2c' }} id="network">
        <h2 className="hp-display-lg">Industry Mentors.</h2>
        <p className="hp-lead">Nhận feedback từ những người giỏi nhất.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#cccccc' }}>
          Nộp bài tập và Portfolio của bạn trực tiếp cho mạng lưới chuyên gia đang làm việc tại các tập đoàn công nghệ hàng đầu. Những lời khuyên thực chiến sẽ giúp bạn tránh khỏi những sai lầm đắt giá.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-text-link-dark" style={{ alignSelf: 'center' }}>Tìm hiểu mạng lưới Mentor &gt;</a>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80" 
          alt="Mentorship" 
          className="hp-product-render"
          style={{ height: '500px', objectFit: 'cover', width: '800px' }}
        />
      </section>

      {/* ── TILE 5: LIGHT - ECOSYSTEM ── */}
      <section className="hp-tile hp-tile-light">
        <h2 className="hp-display-lg">Hệ sinh thái đa chiều.</h2>
        <p className="hp-lead">Không chỉ là học tập. Đây là sân chơi sự nghiệp.</p>
        <p className="hp-body" style={{ maxWidth: '700px', margin: '16px auto 48px', color: '#7a7a7a' }}>
          CareerMap kết nối tất cả các bên liên quan để tạo ra một hành trình khép kín, từ định hướng, đào tạo, đến tuyển dụng.
        </p>

        <div className="hp-utility-grid" style={{ marginTop: '0', maxWidth: '1000px' }}>
          <div className="hp-utility-card">
            <h3 className="hp-utility-card-title">Academic Counselors</h3>
            <p className="hp-body" style={{ margin: '0 0 16px', color: '#7a7a7a' }}>
              Đội ngũ tư vấn viên học thuật luôn sẵn sàng hỗ trợ, gỡ rối những thắc mắc định hướng trong quá trình theo đuổi lộ trình dài hạn.
            </p>
            <a href="#" className="hp-text-link hp-utility-card-action">Trò chuyện cùng Counselor &gt;</a>
          </div>

          <div className="hp-utility-card">
            <h3 className="hp-utility-card-title">Recruiters</h3>
            <p className="hp-body" style={{ margin: '0 0 16px', color: '#7a7a7a' }}>
              Nhà tuyển dụng có thể truy cập nền tảng để theo dõi sự trưởng thành của ứng viên thông qua các bài test và nhận xét từ Mentor.
            </p>
            <a href="#" className="hp-text-link hp-utility-card-action">Đăng tin tuyển dụng &gt;</a>
          </div>
        </div>
      </section>

      {/* ── TILE 6: STORE / PRICING (PARCHMENT) ── */}
      <section className="hp-tile hp-tile-parchment" id="store">
        <h2 className="hp-display-lg">Đầu tư vào chính bạn.</h2>
        <p className="hp-lead">Sở hữu lộ trình, mở khóa tương lai.</p>

        <div className="hp-utility-grid" style={{ maxWidth: '1200px' }}>
          {plans.map((plan) => {
            const details = parsePlanFeatures(plan.featuresJson);
            const isFree = Number(plan.price) === 0;
            const isLoading = checkoutPlanId === plan.id;
            
            return (
              <div key={plan.id} className="hp-utility-card">
                <h3 className="hp-utility-card-title" style={{ fontSize: '24px', marginBottom: '8px' }}>{plan.name}</h3>
                <p className="hp-utility-card-price" style={{ fontSize: '32px', fontWeight: 600, color: '#1d1d1f' }}>
                  {formatMoney(plan.price, plan.currency)}
                </p>
                <div style={{ marginBottom: '32px' }}>
                  <p className="hp-body" style={{ margin: '0 0 24px', color: '#7a7a7a' }}>
                    {plan.description || 'Gói giải pháp giúp bạn nắm bắt cơ hội và rèn luyện các kỹ năng thiết yếu nhất.'}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#1d1d1f' }}>
                    <li className="hp-body" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{color: '#0066cc'}}>✓</span> {details.mentorReviewLimit} lượt Mentor Review
                    </li>
                    {(details.features || []).map((f, i) => (
                      <li key={i} className="hp-body" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                        <span style={{color: '#0066cc'}}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hp-utility-card-action">
                  <button 
                    className="hp-btn-primary" 
                    onClick={() => buyPlan(plan)}
                    disabled={isLoading}
                    style={{ width: '100%', padding: '14px 24px', fontSize: '17px' }}
                  >
                    {isLoading ? 'Đang xử lý...' : isFree ? 'Dùng thử miễn phí' : 'Chọn gói này'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hp-footer">
        <div className="hp-footer-content">
          <div className="hp-footer-fine-print">
            Cần có tài khoản và sự chấp thuận Điều khoản dịch vụ để sử dụng nền tảng CareerMap. Tính năng phân tích AI có thể thay đổi độ chính xác phụ thuộc vào dữ liệu đầu vào. Gói Pro cung cấp đặc quyền review trực tiếp từ Mentor trong vòng 48 giờ. Số lượng mentor hữu hạn tại mỗi thời điểm. Hình ảnh sử dụng mang tính chất minh hoạ.
          </div>
          <div className="hp-footer-links-grid">
            <div className="hp-footer-col">
              <h4>Khám phá</h4>
              <ul>
                <li><a href="#platform">Roadmap</a></li>
                <li><a href="#features">AI Analysis</a></li>
                <li><a href="#network">Mentor Network</a></li>
                <li><a href="#">Portfolio</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Dịch vụ</h4>
              <ul>
                <li><a href="#">Hỗ trợ học viên</a></li>
                <li><a href="#">Tuyển dụng Mentor</a></li>
                <li><a href="#">Dành cho Doanh nghiệp</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Về CareerMap</h4>
              <ul>
                <li><a href="#">Câu chuyện của chúng tôi</a></li>
                <li><a href="#">Tin tức</a></li>
                <li><a href="#">Cơ hội nghề nghiệp</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Pháp lý</h4>
              <ul>
                <li><a href="#">Điều khoản sử dụng</a></li>
                <li><a href="#">Bảo mật thông tin</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="hp-footer-fine-print" style={{ border: 'none', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #e0e0e0' }}>
            Bản quyền © 2026 CareerMap Inc. Bảo lưu mọi quyền.
          </div>
        </div>
      </footer>
    </div>
  );
}
