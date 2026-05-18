import { useState } from 'react';
import { formatMoney } from '../../../shared/format';
import { SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const initialPlanForm = { name: '', description: '', price: 0, currency: 'VND', billingCycle: 'Monthly', mentorReviewLimit: 5, features: '', isActive: true };

export function PlansView({ plans, onLoadPlan, onSavePlan, onDeletePlan }) {
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [saving, setSaving] = useState(false);

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
      features: (latest.features || []).join('\n'),
      isActive: latest.isActive,
    });
  }

  function resetForm() {
    setEditingPlanId('');
    setPlanForm(initialPlanForm);
  }

  async function submitPlan(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...planForm,
      price: Number(planForm.price),
      mentorReviewLimit: Number(planForm.mentorReviewLimit),
      features: planForm.features.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    await onSavePlan(payload, editingPlanId);
    resetForm();
    setSaving(false);
  }

  return (
    <section className="admin-section">
      <SectionHeader title="Subscription plans" subtitle="CRUD số lượt review, giá tiền và trạng thái gói" />
      <div className="plan-layout">
        <form className="plan-form" onSubmit={submitPlan}>
          <h2>{editingPlanId ? 'Sửa gói' : 'Tạo gói'}</h2>
          <label><span>Tên gói</span><input name="name" value={planForm.name} onChange={updatePlanField} required /></label>
          <label><span>Mô tả</span><textarea name="description" value={planForm.description} onChange={updatePlanField} /></label>
          <div className="form-grid"><label><span>Giá</span><input name="price" type="number" min="0" value={planForm.price} onChange={updatePlanField} required /></label><label><span>Lượt mentor review</span><input name="mentorReviewLimit" type="number" min="0" value={planForm.mentorReviewLimit} onChange={updatePlanField} required /></label></div>
          <div className="form-grid"><label><span>Currency</span><input name="currency" value={planForm.currency} onChange={updatePlanField} required /></label><label><span>Billing cycle</span><select name="billingCycle" value={planForm.billingCycle} onChange={updatePlanField}><option value="Free">Free</option><option value="Monthly">Monthly</option></select></label></div>
          <label><span>Features, mỗi dòng một item</span><textarea name="features" value={planForm.features} onChange={updatePlanField} /></label>
          <label className="check-row"><input name="isActive" type="checkbox" checked={planForm.isActive} onChange={updatePlanField} /><span>Đang bán</span></label>
          <div className="button-row"><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu gói'}</button>{editingPlanId && <button type="button" className="secondary-action" onClick={resetForm}>Hủy sửa</button>}</div>
        </form>
        <div className="plan-list">{plans.map((plan) => <article className="plan-card" key={plan.id}><div><h3>{plan.name}</h3><p>{plan.description || 'Không có mô tả'}</p></div><strong>{formatMoney(plan.price, plan.currency)}</strong><span>{plan.mentorReviewLimit} mentor reviews / {plan.billingCycle}</span><StatusPill active={plan.isActive} label={plan.isActive ? 'Active' : 'Inactive'} /><div className="button-row"><button type="button" onClick={() => editPlan(plan)}>Sửa</button><button type="button" onClick={() => onDeletePlan(plan)}>Xóa</button></div></article>)}</div>
      </div>
    </section>
  );
}
