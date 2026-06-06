import { useState } from 'react';
import { SectionTitle } from '../../admin/components/DashboardPrimitives';

const emptyPrerequisite = {
  skillId: '',
  prerequisiteSkillId: '',
};

export function PrerequisitesView({
  prerequisites,
  skills,
  onSavePrerequisite,
  onDeletePrerequisite,
}) {
  const [form, setForm] = useState(emptyPrerequisite);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function reset() {
    setForm(emptyPrerequisite);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSavePrerequisite({
        skillId: form.skillId,
        prerequisiteSkillId: form.prerequisiteSkillId,
      });
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Dependency"
        title="Skill prerequisites"
        subtitle={`${prerequisites.length} dependencies`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New prerequisite
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>New prerequisite</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Skill</span>
                <select name="skillId" value={form.skillId} onChange={updateField} required>
                  <option value="">Select skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Requires (learn first)</span>
                <select name="prerequisiteSkillId" value={form.prerequisiteSkillId} onChange={updateField} required>
                  <option value="">Select prerequisite skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="field-hint">
              Học viên phải hoàn thành kỹ năng tiên quyết trước khi mở kỹ năng này trong lộ trình.
            </p>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create prerequisite'}
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
                <th>Skill</th>
                <th>Requires (learn first)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prerequisites.map((item) => (
                <tr key={item.id}>
                  <td>{item.skillName}</td>
                  <td>{item.prerequisiteSkillName}</td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeletePrerequisite(item)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!prerequisites.length && (
                <tr><td colSpan={3}><p className="empty-state">No prerequisites yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
