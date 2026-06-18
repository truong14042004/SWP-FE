import { useState } from 'react';
import { SectionTitle } from '../../admin/components/DashboardPrimitives';

const emptyRequirement = {
  careerRoleId: '',
  skillId: '',
  requiredLevel: 'Beginner',
  priority: 1,
  weight: 1,
};

export function RequirementsView({
  requirements,
  careerRoles,
  skills,
  onLoadRequirement,
  onSaveRequirement,
  onDeleteRequirement,
}) {
  const [form, setForm] = useState(emptyRequirement);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function edit(requirement) {
    setFormError('');
    try {
      const latest = await onLoadRequirement(requirement.id);
      setEditingId(latest.id);
      setForm({
        careerRoleId: latest.careerRoleId,
        skillId: latest.skillId,
        requiredLevel: latest.requiredLevel,
        priority: latest.priority,
        weight: latest.weight,
      });
      setShowForm(true);
    } catch (error) {
      setFormError(error?.message || 'Could not load this requirement for editing.');
      setShowForm(true);
    }
  }

  function reset() {
    setEditingId('');
    setForm(emptyRequirement);
    setFormError('');
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveRequirement(
        {
          careerRoleId: form.careerRoleId,
          skillId: form.skillId,
          requiredLevel: form.requiredLevel,
          priority: Number(form.priority),
          weight: Number(form.weight),
        },
        editingId,
      );
      reset();
    } catch (error) {
      setFormError(error?.message || 'Could not save this requirement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Mapping"
        title="Role skill requirements"
        subtitle={`${requirements.length} mappings`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New requirement
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit requirement' : 'New requirement'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Career role</span>
                <select name="careerRoleId" value={form.careerRoleId} onChange={updateField} required>
                  <option value="">Select role</option>
                  {careerRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Skill</span>
                <select name="skillId" value={form.skillId} onChange={updateField} required>
                  <option value="">Select skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row three">
              <label>
                <span>Required level</span>
                <select name="requiredLevel" value={form.requiredLevel} onChange={updateField}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label>
                <span>Priority (1–5)</span>
                <input name="priority" type="number" min="1" max="5" value={form.priority} onChange={updateField} />
              </label>
              <label>
                <span>Weight</span>
                <input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={updateField} />
              </label>
            </div>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create requirement'}
              </button>
              <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-wrap">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Career role</th>
                <th>Skill</th>
                <th>Level</th>
                <th>Priority · Weight</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((item) => (
                <tr key={item.id}>
                  <td>{item.careerRoleName}</td>
                  <td>{item.skillName}</td>
                  <td>{item.requiredLevel}</td>
                  <td>{item.priority} · {item.weight}</td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(item)}>Edit</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteRequirement(item)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!requirements.length && (
                <tr><td colSpan={5}><p className="empty-state">No requirements yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
