import { useState } from 'react';
import { formatMoney } from '../../../shared/format';
import { SectionTitle, StatusPill } from '../components/DashboardPrimitives';

const initialPlanForm = {
  name: '',
  description: '',
  price: 0,
  currency: 'VND',
  billingCycle: 'Monthly',
  mentorReviewLimit: 5,
  aiChatLimit: 100,
  features: '',
  isActive: true,
};

export function PlansView({ plans, onLoadPlan, onSavePlan, onDeletePlan }) {
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function updatePlanField(event) {
    const { name, value, type, checked } = event.target;
    setPlanForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function editPlan(plan) {
    const latest = await onLoadPlan(plan.id);
    setEditingPlanId(latest.id);
    setPlanForm({
      name: latest.name,
      description: latest.description || '',
      price: latest.price,
      currency: latest.currency,
      billingCycle: latest.billingCycle,
      mentorReviewLimit: latest.mentorReviewLimit,
      aiChatLimit: latest.aiChatLimit !== undefined ? latest.aiChatLimit : 100,
      features: (latest.features || []).join('\n'),
      isActive: latest.isActive,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingPlanId('');
    setPlanForm(initialPlanForm);
    setShowForm(false);
  }

  async function submitPlan(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...planForm,
      price: Number(planForm.price),
      mentorReviewLimit: Number(planForm.mentorReviewLimit),
      aiChatLimit: Number(planForm.aiChatLimit),
      features: planForm.features.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    await onSavePlan(payload, editingPlanId);
    resetForm();
    setSaving(false);
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Danh mục"
        title="Gói dịch vụ"
        subtitle={`Đã thiết lập ${plans.length} gói`}
        action={
          <button
            type="button"
            className="pill-button"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            Thêm gói
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingPlanId ? 'Sửa gói' : 'Tạo gói mới'}</h3>
            <button type="button" className="icon-close" onClick={resetForm} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submitPlan}>
            <div className="field-row three">
              <label>
                <span>Tên gói</span>
                <input name="name" value={planForm.name} onChange={updatePlanField} required />
              </label>
              <label>
                <span>Giá</span>
                <input name="price" type="number" min="0" value={planForm.price} onChange={updatePlanField} required />
              </label>
              <label>
                <span>Đơn vị tiền tệ</span>
                <input name="currency" value={planForm.currency} onChange={updatePlanField} required />
              </label>
            </div>
            <div className="field-row three">
              <label>
                <span>Chu kỳ thanh toán</span>
                <select name="billingCycle" value={planForm.billingCycle} onChange={updatePlanField}>
                  <option value="Free">Miễn phí</option>
                  <option value="Monthly">Hàng tháng</option>
                  <option value="Yearly">Hàng năm</option>
                </select>
              </label>
              <label>
                <span>Giới hạn lượt mentor đánh giá (-1 = không giới hạn)</span>
                <input name="mentorReviewLimit" type="number" min="-1" value={planForm.mentorReviewLimit} onChange={updatePlanField} required />
              </label>
              <label>
                <span>Giới hạn lượt chat AI (-1 = không giới hạn)</span>
                <input name="aiChatLimit" type="number" min="-1" value={planForm.aiChatLimit} onChange={updatePlanField} required />
              </label>
            </div>
            <label>
              <span>Mô tả</span>
              <textarea name="description" value={planForm.description} onChange={updatePlanField} rows={2} />
            </label>
            <label>
              <span>Tính năng (mỗi dòng một mục)</span>
              <textarea name="features" value={planForm.features} onChange={updatePlanField} rows={4} />
            </label>
            <label className="check-row">
              <input name="isActive" type="checkbox" checked={planForm.isActive} onChange={updatePlanField} />
              <span>Đang hoạt động (có thể mua)</span>
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingPlanId ? 'Lưu thay đổi' : 'Tạo gói'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="plan-grid">
        {plans.map((plan) => (
          <article className="plan-card" key={plan.id}>
            <header className="plan-card-head">
              <div>
                <h3>{plan.name}</h3>
                <p>{plan.description || 'Không có mô tả'}</p>
              </div>
              <StatusPill active={plan.isActive} />
            </header>

            <div className="plan-card-price">
              <strong>{formatMoney(plan.price, plan.currency)}</strong>
              <span>/ {plan.billingCycle}</span>
            </div>

            <div className="plan-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <strong>Lượt mentor đánh giá:</strong> {plan.mentorReviewLimit === -1 ? 'Không giới hạn' : plan.mentorReviewLimit}
              </div>
              <div>
                <strong>Giới hạn chat AI:</strong> {plan.aiChatLimit === -1 ? 'Không giới hạn' : plan.aiChatLimit}
              </div>
            </div>

            {plan.features?.length > 0 && (
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}

            <div className="button-row">
              <button type="button" className="btn-secondary" onClick={() => editPlan(plan)}>Sửa</button>
              <button
                type="button"
                className="btn-secondary danger-action"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc muốn xóa gói "${plan.name}"? Việc này có thể ảnh hưởng đến những người dùng đang sử dụng gói này.`)) {
                    onDeletePlan(plan);
                  }
                }}
              >
                Xóa
              </button>
            </div>
          </article>
        ))}
        {!plans.length && (
          <p className="empty-state">Chưa có gói dịch vụ nào.</p>
        )}
      </div>
    </section>
  );
}
