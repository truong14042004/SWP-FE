import { useState } from 'react';
import { SectionHeader } from '../components/DashboardPrimitives';

const emptyRequirement = {
  careerRoleId: '',
  skillId: '',
  requiredLevel: 'Beginner',
  priority: 1,
  weight: 1,
};

export function RequirementsView({ requirements, careerRoles, skills, onLoadRequirement, onSaveRequirement, onDeleteRequirement }) {
  const [form, setForm] = useState(emptyRequirement);
  const [editingId, setEditingId] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function edit(requirement) {
    const latest = await onLoadRequirement(requirement.id);
    setEditingId(latest.id);
    setForm({
      careerRoleId: latest.careerRoleId,
      skillId: latest.skillId,
      requiredLevel: latest.requiredLevel,
      priority: latest.priority,
      weight: latest.weight,
    });
  }

  function reset() {
    setEditingId('');
    setForm(emptyRequirement);
  }

  async function submit(event) {
    event.preventDefault();
    await onSaveRequirement({
      careerRoleId: form.careerRoleId,
      skillId: form.skillId,
      requiredLevel: form.requiredLevel,
      priority: Number(form.priority),
      weight: Number(form.weight),
    }, editingId);
    reset();
  }

  return (
    <section className="admin-section">
      <SectionHeader title="Role skill requirements" subtitle={`${requirements.length} requirements`} />
      <div className="plan-layout">
        <form className="plan-form" onSubmit={submit}>
          <h2>{editingId ? 'Sửa requirement' : 'Thêm requirement'}</h2>
          <label><span>Career role</span><select name="careerRoleId" value={form.careerRoleId} onChange={updateField} required><option value="">Select role</option>{careerRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <label><span>Skill</span><select name="skillId" value={form.skillId} onChange={updateField} required><option value="">Select skill</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label>
          <div className="form-grid">
            <label><span>Required level</span><select name="requiredLevel" value={form.requiredLevel} onChange={updateField}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label><span>Priority</span><input name="priority" type="number" min="1" max="5" value={form.priority} onChange={updateField} /></label>
          </div>
          <label><span>Weight</span><input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={updateField} /></label>
          <div className="button-row">
            <button className="primary-action" type="submit">Lưu requirement</button>
            {editingId && <button type="button" className="secondary-action" onClick={reset}>Hủy</button>}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Career role</th><th>Skill</th><th>Level</th><th>Priority</th><th></th></tr></thead>
            <tbody>
              {requirements.map((item) => (
                <tr key={item.id}>
                  <td>{item.careerRoleName}</td>
                  <td>{item.skillName}</td>
                  <td>{item.requiredLevel}</td>
                  <td>{item.priority} · {item.weight}</td>
                  <td className="table-actions">
                    <button type="button" onClick={() => edit(item)}>Sửa</button>
                    <button type="button" onClick={() => onDeleteRequirement(item)}>Xóa</button>
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
