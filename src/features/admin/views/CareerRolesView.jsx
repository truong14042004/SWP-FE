import { useState } from 'react';
import { SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const emptyCareerRole = { name: '', description: '', level: '', isActive: true };

export function CareerRolesView({ careerRoles, onLoadCareerRole, onSaveCareerRole, onDeleteCareerRole }) {
  const [form, setForm] = useState(emptyCareerRole);
  const [editingId, setEditingId] = useState('');

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
  }

  function reset() {
    setEditingId('');
    setForm(emptyCareerRole);
  }

  async function submit(event) {
    event.preventDefault();
    await onSaveCareerRole(form, editingId);
    reset();
  }

  return (
    <section className="admin-section">
      <SectionHeader title="Career roles" subtitle={`${careerRoles.length} roles`} />
      <div className="plan-layout">
        <form className="plan-form" onSubmit={submit}>
          <h2>{editingId ? 'Sửa career role' : 'Tạo career role'}</h2>
          <label><span>Name</span><input name="name" value={form.name} onChange={updateField} required /></label>
          <label><span>Description</span><textarea name="description" value={form.description} onChange={updateField} /></label>
          <label><span>Level</span><input name="level" value={form.level} onChange={updateField} /></label>
          <label className="check-row"><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /><span>Active</span></label>
          <div className="button-row">
            <button className="primary-action" type="submit">Lưu role</button>
            {editingId && <button type="button" className="secondary-action" onClick={reset}>Hủy</button>}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Role</th><th>Level</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {careerRoles.map((role) => (
                <tr key={role.id}>
                  <td><strong>{role.name}</strong><span>{role.description || 'No description'}</span></td>
                  <td>{role.level || '-'}</td>
                  <td><StatusPill active={role.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" onClick={() => edit(role)}>Sửa</button>
                    <button type="button" onClick={() => onDeleteCareerRole(role)}>Tắt</button>
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
