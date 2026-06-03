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
        eyebrow="Catalog"
        title="Subscription plans"
        subtitle={`${plans.length} plans defined`}
        action={
          <button
            type="button"
            className="pill-button"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            New plan
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingPlanId ? 'Edit plan' : 'Create new plan'}</h3>
            <button type="button" className="icon-close" onClick={resetForm} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submitPlan}>
            <div className="field-row three">
              <label>
                <span>Plan name</span>
                <input name="name" value={planForm.name} onChange={updatePlanField} required />
              </label>
              <label>
                <span>Price</span>
                <input name="price" type="number" min="0" value={planForm.price} onChange={updatePlanField} required />
              </label>
              <label>
                <span>Currency</span>
                <input name="currency" value={planForm.currency} onChange={updatePlanField} required />
              </label>
            </div>
            <div className="field-row three">
              <label>
                <span>Billing cycle</span>
                <select name="billingCycle" value={planForm.billingCycle} onChange={updatePlanField}>
                  <option value="Free">Free</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </label>
              <label>
                <span>Mentor review limit (-1 = unlimited)</span>
                <input name="mentorReviewLimit" type="number" min="-1" value={planForm.mentorReviewLimit} onChange={updatePlanField} required />
              </label>
              <label>
                <span>AI chat limit (-1 = unlimited)</span>
                <input name="aiChatLimit" type="number" min="-1" value={planForm.aiChatLimit} onChange={updatePlanField} required />
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea name="description" value={planForm.description} onChange={updatePlanField} rows={2} />
            </label>
            <label>
              <span>Features (one per line)</span>
              <textarea name="features" value={planForm.features} onChange={updatePlanField} rows={4} />
            </label>
            <label className="check-row">
              <input name="isActive" type="checkbox" checked={planForm.isActive} onChange={updatePlanField} />
              <span>Active (available for purchase)</span>
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingPlanId ? 'Save changes' : 'Create plan'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
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
                <p>{plan.description || 'No description'}</p>
              </div>
              <StatusPill active={plan.isActive} />
            </header>

            <div className="plan-card-price">
              <strong>{formatMoney(plan.price, plan.currency)}</strong>
              <span>/ {plan.billingCycle}</span>
            </div>

            <div className="plan-card-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <strong>Mentor reviews:</strong> {plan.mentorReviewLimit === -1 ? 'Unlimited' : plan.mentorReviewLimit}
              </div>
              <div>
                <strong>AI Chat limit:</strong> {plan.aiChatLimit === -1 ? 'Unlimited' : plan.aiChatLimit}
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
              <button type="button" className="btn-secondary" onClick={() => editPlan(plan)}>Edit</button>
              <button type="button" className="btn-secondary danger-action" onClick={() => onDeletePlan(plan)}>Delete</button>
            </div>
          </article>
        ))}
        {!plans.length && (
          <p className="empty-state">No plans defined yet.</p>
        )}
      </div>
    </section>
  );
}
