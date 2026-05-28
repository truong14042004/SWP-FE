import { useState } from 'react';
import { SectionTitle, StatusPill } from '../components/DashboardPrimitives';

const emptySkill = { name: '', category: '', description: '', isActive: true };

const defaultSkillCategories = [
  'AI',
  'Backend',
  'Career',
  'Cloud',
  'Data',
  'DevOps',
  'Engineering',
  'Frontend',
  'Mobile',
  'QA',
];

export function SkillsView({ skills, onLoadSkill, onSaveSkill, onDeleteSkill }) {
  const [form, setForm] = useState(emptySkill);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const categoryOptions = Array.from(
    new Set([
      ...defaultSkillCategories,
      ...skills.map((skill) => skill.category).filter(Boolean),
    ]),
  ).sort((first, second) => first.localeCompare(second));

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function edit(skill) {
    const latest = await onLoadSkill(skill.id);
    setEditingId(latest.id);
    setForm({
      name: latest.name,
      category: latest.category,
      description: latest.description || '',
      isActive: latest.isActive,
    });
    setShowForm(true);
  }

  function reset() {
    setEditingId('');
    setForm(emptySkill);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveSkill(form, editingId);
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Catalog"
        title="Skills"
        subtitle={`${skills.length} skills tracked`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New skill
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit skill' : 'Create new skill'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label>
                <span>Category</span>
                <select name="category" value={form.category} onChange={updateField} required>
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create skill'}
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
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td>
                    <strong>{skill.name}</strong>
                    <span>{skill.description || 'No description'}</span>
                  </td>
                  <td>{skill.category}</td>
                  <td><StatusPill active={skill.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(skill)}>Edit</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteSkill(skill)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!skills.length && (
                <tr><td colSpan={4}><p className="empty-state">No skills yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
