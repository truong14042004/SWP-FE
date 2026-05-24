import { useState } from 'react';
import { formatDate } from '../../../shared/format';
import { SectionTitle, StatusPill } from '../components/DashboardPrimitives';

const emptyResource = {
  skillId: '',
  title: '',
  url: '',
  resourceType: 'Article',
  difficulty: 'Beginner',
  estimatedHours: 1,
  lessonNumber: 1,
  isActive: true,
  file: null,
};

export function ResourcesView({
  resources,
  skills,
  onLoadResource,
  onSaveResource,
  onDeleteResource,
}) {
  const [form, setForm] = useState(emptyResource);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function edit(resource) {
    const latest = await onLoadResource(resource.id);
    setEditingId(latest.id);
    setForm({
      skillId: latest.skillId || '',
      title: latest.title,
      url: latest.url,
      resourceType: latest.resourceType,
      difficulty: latest.difficulty || '',
      estimatedHours: latest.estimatedHours || 0,
      lessonNumber: latest.lessonNumber ?? 1,
      isActive: latest.isActive,
      file: null,
    });
    setShowForm(true);
  }

  function reset() {
    setEditingId('');
    setForm(emptyResource);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      skillId: form.skillId || null,
      estimatedHours: Number(form.estimatedHours),
      lessonNumber: Number(form.lessonNumber),
    };

    try {
      await onSaveResource(payload, editingId);
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Library"
        title="Learning resources"
        subtitle={`${resources.length} resources`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New resource
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit resource' : 'New resource'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Skill</span>
                <select name="skillId" value={form.skillId} onChange={updateField}>
                  <option value="">No skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Title</span>
                <input name="title" value={form.title} onChange={updateField} required />
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>URL</span>
                <input
                  name="url"
                  type="url"
                  value={form.url}
                  onChange={updateField}
                  placeholder="https://..."
                  required={!form.file}
                />
              </label>
              <label>
                <span>File upload</span>
                <input
                  name="file"
                  type="file"
                  onChange={updateField}
                />
                {form.file && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>{form.file.name}</small>}
                {editingId && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>Leave empty to keep existing file (or just update URL)</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Type</span>
                <input name="resourceType" value={form.resourceType} onChange={updateField} required />
              </label>
              <label>
                <span>Difficulty</span>
                <input name="difficulty" value={form.difficulty} onChange={updateField} />
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Estimated hours</span>
                <input name="estimatedHours" type="number" min="0" value={form.estimatedHours} onChange={updateField} />
              </label>
              <label>
                <span>Lesson number</span>
                <input name="lessonNumber" type="number" min="1" value={form.lessonNumber} onChange={updateField} required />
              </label>
            </div>

            <label className="check-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              <span>Active</span>
            </label>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create resource'}
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
                <th>Resource</th>
                <th>Skill</th>
                <th>Source</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <strong>{resource.title}</strong>
                    <span>Lesson {resource.lessonNumber} · {resource.resourceType} · {formatDate(resource.updatedAt)}</span>
                  </td>
                  <td>{resource.skillName || '—'}</td>
                  <td>{resource.sourceType}</td>
                  <td><StatusPill active={resource.isActive} /></td>
                  <td className="table-actions">
                    <a className="btn-secondary text-link" href={resource.url} target="_blank" rel="noreferrer">Open</a>
                    <button type="button" className="btn-secondary" onClick={() => edit(resource)}>Edit</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteResource(resource)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!resources.length && (
                <tr><td colSpan={5}><p className="empty-state">No resources yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
