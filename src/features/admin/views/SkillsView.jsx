import { useState } from 'react';
import { SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const emptySkill = { name: '', category: '', description: '', isActive: true };

export function SkillsView({ skills, onLoadSkill, onSaveSkill, onDeleteSkill }) {
  const [form, setForm] = useState(emptySkill);
  const [editingId, setEditingId] = useState('');

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
  }

  function reset() {
    setEditingId('');
    setForm(emptySkill);
  }

  async function submit(event) {
    event.preventDefault();
    await onSaveSkill(form, editingId);
    reset();
  }

  return (
    <section className="admin-section">
      <SectionHeader title="Skill management" subtitle={`${skills.length} skills`} />
      <div className="plan-layout">
        <form className="plan-form" onSubmit={submit}>
          <h2>{editingId ? 'Sửa skill' : 'Tạo skill'}</h2>
          <label><span>Name</span><input name="name" value={form.name} onChange={updateField} required /></label>
          <label><span>Category</span><input name="category" value={form.category} onChange={updateField} required /></label>
          <label><span>Description</span><textarea name="description" value={form.description} onChange={updateField} /></label>
          <label className="check-row"><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /><span>Active</span></label>
          <div className="button-row">
            <button className="primary-action" type="submit">Lưu skill</button>
            {editingId && <button type="button" className="secondary-action" onClick={reset}>Hủy</button>}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td><strong>{skill.name}</strong><span>{skill.description || 'No description'}</span></td>
                  <td>{skill.category}</td>
                  <td><StatusPill active={skill.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" onClick={() => edit(skill)}>Sửa</button>
                    <button type="button" onClick={() => onDeleteSkill(skill)}>Xóa</button>
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
