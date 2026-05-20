import { useState } from 'react';
import { SectionTitle, StatusPill } from '../components/DashboardPrimitives';

const emptyCareerRole = { name: '', description: '', level: '', isActive: true };

export function CareerRolesView({
  careerRoles,
  onLoadCareerRole,
  onSaveCareerRole,
  onDeleteCareerRole,
}) {
  const [form, setForm] = useState(emptyCareerRole);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function edit(role) {
    const latest = await onLoadCareerRole(role.id);
    setEditingId(latest.id);
    setForm({
      name: latest.name,
      description: latest.description || '',
      level: latest.level || '',
      isActive: latest.isActive,
    });
    setShowForm(true);
  }

  function reset() {
    setEditingId('');
    setForm(emptyCareerRole);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveCareerRole(form, editingId);
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Career"
        title="Career roles"
        subtitle={`${careerRoles.length} roles`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New career role
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit career role' : 'New career role'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label>
                <span>Level</span>
                <input name="level" value={form.level} onChange={updateField} placeholder="Junior, Mid, Senior…" />
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={updateField} rows={3} />
            </label>
            <label className="check-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              <span>Active</span>
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create role'}
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
                <th>Role</th>
                <th>Level</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {careerRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    <span>{role.description || 'No description'}</span>
                  </td>
                  <td>{role.level || '—'}</td>
                  <td><StatusPill active={role.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(role)}>Edit</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteCareerRole(role)}>Disable</button>
                  </td>
                </tr>
              ))}
              {!careerRoles.length && (
                <tr><td colSpan={4}><p className="empty-state">No career roles yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
