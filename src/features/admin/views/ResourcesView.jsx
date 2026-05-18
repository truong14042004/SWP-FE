import { useState } from 'react';
import { formatDate } from '../../../shared/format';
import { SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const emptyResource = {
  skillId: '',
  title: '',
  url: '',
  resourceType: 'Article',
  difficulty: 'Beginner',
  estimatedHours: 1,
  isActive: true,
  file: null,
};

export function ResourcesView({ resources, skills, onLoadResource, onSaveResource, onUploadResource, onDeleteResource }) {
  const [mode, setMode] = useState('link');
  const [form, setForm] = useState(emptyResource);
  const [editingId, setEditingId] = useState('');

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function edit(resource) {
    const latest = await onLoadResource(resource.id);
    setMode('link');
    setEditingId(latest.id);
    setForm({
      skillId: latest.skillId || '',
      title: latest.title,
      url: latest.url,
      resourceType: latest.resourceType,
      difficulty: latest.difficulty || '',
      estimatedHours: latest.estimatedHours || 0,
      isActive: latest.isActive,
      file: null,
    });
  }

  function reset() {
    setMode('link');
    setEditingId('');
    setForm(emptyResource);
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      skillId: form.skillId || null,
      estimatedHours: Number(form.estimatedHours),
    };

    if (mode === 'file' && !editingId) {
      await onUploadResource(payload);
    } else {
      await onSaveResource({
        skillId: payload.skillId,
        title: payload.title,
        url: payload.url,
        resourceType: payload.resourceType,
        difficulty: payload.difficulty,
        estimatedHours: payload.estimatedHours,
        isActive: payload.isActive,
      }, editingId);
    }
    reset();
  }

  return (
    <section className="admin-section">
      <SectionHeader title="Learning resources" subtitle={`${resources.length} resources`} />
      <div className="plan-layout">
        <form className="plan-form" onSubmit={submit}>
          <h2>{editingId ? 'Sửa tài nguyên' : 'Thêm tài nguyên'}</h2>
          <div className="admin-tabs">
            <button type="button" className={mode === 'link' ? 'active' : ''} onClick={() => setMode('link')}>Link</button>
            <button type="button" className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')} disabled={Boolean(editingId)}>File</button>
          </div>
          <label><span>Skill</span><select name="skillId" value={form.skillId} onChange={updateField}><option value="">No skill</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label>
          <label><span>Title</span><input name="title" value={form.title} onChange={updateField} required /></label>
          {mode === 'link'
            ? <label><span>URL</span><input name="url" value={form.url} onChange={updateField} placeholder="https://..." required /></label>
            : <label><span>File</span><input name="file" type="file" onChange={updateField} required /></label>}
          <div className="form-grid">
            <label><span>Type</span><input name="resourceType" value={form.resourceType} onChange={updateField} required /></label>
            <label><span>Difficulty</span><input name="difficulty" value={form.difficulty} onChange={updateField} /></label>
          </div>
          <label><span>Estimated hours</span><input name="estimatedHours" type="number" min="0" value={form.estimatedHours} onChange={updateField} /></label>
          <label className="check-row"><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /><span>Active</span></label>
          <div className="button-row">
            <button className="primary-action" type="submit">Lưu tài nguyên</button>
            {editingId && <button type="button" className="secondary-action" onClick={reset}>Hủy</button>}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Resource</th><th>Skill</th><th>Source</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td><strong>{resource.title}</strong><span>{resource.resourceType} · {formatDate(resource.updatedAt)}</span></td>
                  <td>{resource.skillName || '-'}</td>
                  <td>{resource.sourceType}</td>
                  <td><StatusPill active={resource.isActive} /></td>
                  <td className="table-actions">
                    <a className="text-link" href={resource.url} target="_blank" rel="noreferrer">Open</a>
                    <button type="button" onClick={() => edit(resource)}>Sửa</button>
                    <button type="button" onClick={() => onDeleteResource(resource)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
