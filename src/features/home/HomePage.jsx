import { useEffect, useState } from 'react';
import {
  createSubscriptionCheckout,
  getMySubscriptions,
  getSubscriptionPlans,
  parsePlanFeatures,
} from '../subscriptions/subscriptionApi';
import { formatMoney } from '../../shared/format';
import '../../styles/home.css';

export function HomePage({ session, onLogin, onSignOut, onOpenDashboard }) {
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
      setPlans(planList);
      setSubscriptions(subList);
    } catch (err) {
      console.error(err);
    }
  }

  async function buyPlan(plan) {
    if (!session) {
      onLogin();
      return;
    }
    setCheckoutPlanId(plan.id);
    try {
      const checkout = await createSubscriptionCheckout(session, plan.id);
      if (checkout.checkoutUrl) window.location.assign(checkout.checkoutUrl);
      else await loadPlans();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckoutPlanId('');
    }
  }

  return (
    <div className="hp-root">
      <nav className="hp-global-nav">
        <a href="#" style={{ textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '15px' }}>
          CareerMap
        </a>
        <div className="hp-global-nav-links">
          <a href="#platform">Nen tang</a>
          <a href="#features">Tinh nang</a>
          <a href="#network">Mang luoi</a>
          <a href="#store">Dang ky</a>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {isLoggedIn ? (
            <>
              <button className="hp-dark-utility-btn" onClick={onOpenDashboard}>Dashboard</button>
              <button className="hp-dark-utility-btn" onClick={onSignOut}>Dang xuat</button>
            </>
          ) : (
            <button className="hp-dark-utility-btn" onClick={onLogin}>Dang nhap</button>
          )}
        </div>
      </nav>

      <section className="hp-tile hp-tile-light" id="platform">
        <h1 className="hp-hero-display">CareerMap.</h1>
        <p className="hp-lead">Xac dinh diem den. Ve loi di rieng.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#7a7a7a' }}>
          Nen tang huong nghiep toan dien ket hop tri tue nhan tao va mang luoi chuyen gia.
          Giup ban chuyen doi tu nguoi moi bat dau thanh chuyen gia thuc thu.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-btn-primary">Bat dau mien phi</a>
          <a href="#features" className="hp-text-link" style={{ alignSelf: 'center' }}>Kham pha quy trinh &gt;</a>
        </div>
        <img
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80"
          alt="CareerMap Dashboard"
          className="hp-product-render"
          style={{ height: '500px', objectFit: 'cover', width: '1200px' }}
        />
      </section>

      <section className="hp-tile hp-tile-dark" id="features">
        <h2 className="hp-display-lg">AI Gap Analysis.</h2>
        <p className="hp-lead">Phat hien lo hong ky nang trong 30 giay.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#cccccc' }}>
          Thuat toan AI phan tich CV cua ban, doi chieu voi mo ta cong viec thuc te tren thi truong
          va chi ra nhung ky nang ban con thieu de di nhanh hon den muc tieu nghe nghiep.
        </p>
        <div className="hp-actions-row">
          <button onClick={onLogin} className="hp-btn-primary">Phan tich CV ngay</button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
          alt="AI Analysis"
          className="hp-product-render"
          style={{ height: '400px', objectFit: 'cover', width: '900px' }}
        />
      </section>

      <section className="hp-tile hp-tile-parchment">
        <h2 className="hp-display-lg">Lo trinh ca nhan hoa.</h2>
        <p className="hp-lead">Tung buoc mot, den dung muc tieu.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#7a7a7a' }}>
          Dua tren ket qua phan tich, he thong tu dong sinh ra ban do hoc tap rieng,
          gom tai lieu, bai tap va du an thuc te de bo sung dung nhung manh ghep dang thieu.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-text-link" style={{ alignSelf: 'center' }}>Xem vi du roadmap &gt;</a>
        </div>
        <img
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
          alt="Roadmap Generation"
          className="hp-product-render"
          style={{ height: '400px', objectFit: 'cover', width: '900px' }}
        />
      </section>

      <section className="hp-tile hp-tile-dark" style={{ background: '#2a2a2c' }} id="network">
        <h2 className="hp-display-lg">Industry Mentors.</h2>
        <p className="hp-lead">Nhan feedback tu nhung nguoi gioi nhat.</p>
        <p className="hp-body" style={{ maxWidth: '600px', margin: '16px auto 0', color: '#cccccc' }}>
          Nop bai tap va portfolio truc tiep cho mang luoi chuyen gia dang lam viec tai doanh nghiep,
          nhan gop y thuc chien de tranh nhung sai lam ton thoi gian va chi phi.
        </p>
        <div className="hp-actions-row">
          <a href="#store" className="hp-text-link-dark" style={{ alignSelf: 'center' }}>Tim hieu mang luoi mentor &gt;</a>
        </div>
        <img
          src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80"
          alt="Mentorship"
          className="hp-product-render"
          style={{ height: '500px', objectFit: 'cover', width: '800px' }}
        />
      </section>

      <section className="hp-tile hp-tile-light">
        <h2 className="hp-display-lg">He sinh thai da chieu.</h2>
        <p className="hp-lead">Khong chi la hoc tap. Day la san choi su nghiep.</p>
        <p className="hp-body" style={{ maxWidth: '700px', margin: '16px auto 48px', color: '#7a7a7a' }}>
          CareerMap ket noi cac ben lien quan de tao mot hanh trinh khep kin, tu dinh huong,
          dao tao den danh gia nang luc va tim kiem co hoi nghe nghiep.
        </p>

        <div className="hp-utility-grid" style={{ marginTop: '0', maxWidth: '1000px' }}>
          <div className="hp-utility-card">
            <h3 className="hp-utility-card-title">Academic Counselors</h3>
            <p className="hp-body" style={{ margin: '0 0 16px', color: '#7a7a7a' }}>
              Doi ngu tu van vien hoc thuat ho tro thao go dinh huong va giu dong luc trong suot qua trinh theo duoi lo trinh.
            </p>
            <a href="#" className="hp-text-link hp-utility-card-action">Tro chuyen cung counselor &gt;</a>
          </div>

          <div className="hp-utility-card">
            <h3 className="hp-utility-card-title">Recruiters</h3>
            <p className="hp-body" style={{ margin: '0 0 16px', color: '#7a7a7a' }}>
              Nha tuyen dung co the theo doi su truong thanh cua ung vien thong qua bai test, portfolio va nhan xet tu mentor.
            </p>
            <a href="#" className="hp-text-link hp-utility-card-action">Dang tin tuyen dung &gt;</a>
          </div>
        </div>
      </section>

      <section className="hp-tile hp-tile-parchment" id="store">
        <h2 className="hp-display-lg">Dau tu vao chinh ban.</h2>
        <p className="hp-lead">So huu lo trinh, mo khoa tuong lai.</p>

        {subscriptions.length > 0 && (
          <p className="hp-body" style={{ marginTop: '20px', color: '#4b5563' }}>
            Ban dang co {subscriptions.length} goi dang ky trong tai khoan.
          </p>
        )}

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
                    {plan.description || 'Goi giai phap giup ban nam bat co hoi va ren luyen cac ky nang thiet yeu nhat.'}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#1d1d1f' }}>
                    <li className="hp-body" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#0066cc' }}>+</span> {details.mentorReviewLimit} luot Mentor Review
                    </li>
                    {(details.features || []).map((feature, index) => (
                      <li key={index} className="hp-body" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#0066cc' }}>+</span> {feature}
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
                    {isLoading ? 'Dang xu ly...' : isFree ? 'Dung thu mien phi' : 'Chon goi nay'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="hp-footer">
        <div className="hp-footer-content">
          <div className="hp-footer-fine-print">
            Nen tang CareerMap cung cap cong cu dinh huong, phan tich AI va ket noi mentor phu hop voi tung giai doan phat trien cua ban.
          </div>
          <div className="hp-footer-links-grid">
            <div className="hp-footer-col">
              <h4>Kham pha</h4>
              <ul>
                <li><a href="#platform">Roadmap</a></li>
                <li><a href="#features">AI Analysis</a></li>
                <li><a href="#network">Mentor Network</a></li>
                <li><a href="#">Portfolio</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Dich vu</h4>
              <ul>
                <li><a href="#">Ho tro hoc vien</a></li>
                <li><a href="#">Tuyen dung Mentor</a></li>
                <li><a href="#">Danh cho Doanh nghiep</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Ve CareerMap</h4>
              <ul>
                <li><a href="#">Cau chuyen cua chung toi</a></li>
                <li><a href="#">Tin tuc</a></li>
                <li><a href="#">Co hoi nghe nghiep</a></li>
              </ul>
            </div>
            <div className="hp-footer-col">
              <h4>Phap ly</h4>
              <ul>
                <li><a href="#">Dieu khoan su dung</a></li>
                <li><a href="#">Bao mat thong tin</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="hp-footer-fine-print" style={{ border: 'none', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #e0e0e0' }}>
            Ban quyen © 2026 CareerMap Inc. Bao luu moi quyen.
          </div>
        </div>
      </footer>
    </div>
  );
}
