import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
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
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function reset() {
    setForm(emptyPrerequisite);
    setFormError('');
    setShowForm(false);
  }

  const filteredPrerequisites = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return prerequisites;
    return prerequisites.filter((item) => {
      const haystack = [item.skillName, item.prerequisiteSkillName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [prerequisites, search]);

  const hasActiveFilter = Boolean(search);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSavePrerequisite({
        skillId: form.skillId,
        prerequisiteSkillId: form.prerequisiteSkillId,
      });
      toast.success('Đã tạo tiên quyết mới.');
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được tiên quyết.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa quan hệ tiên quyết "${item.skillName}" cần "${item.prerequisiteSkillName}"?`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await onDeletePrerequisite(item);
      toast.success('Đã xóa tiên quyết.');
    } catch (error) {
      toast.error(error?.message || 'Không xóa được tiên quyết.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Phụ thuộc"
        title="Kỹ năng tiên quyết"
        subtitle={`${filteredPrerequisites.length}/${prerequisites.length} phụ thuộc`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm tiên quyết
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>Thêm tiên quyết</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Kỹ năng</span>
                <select name="skillId" value={form.skillId} onChange={updateField} required>
                  <option value="">Chọn kỹ năng</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Yêu cầu (học trước)</span>
                <select name="prerequisiteSkillId" value={form.prerequisiteSkillId} onChange={updateField} required>
                  <option value="">Chọn kỹ năng tiên quyết</option>
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
                {saving ? 'Đang lưu…' : 'Tạo tiên quyết'}
              </button>
              <button type="button" className="btn-secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="resource-toolbar">
        <input
          type="search"
          className="resource-search"
          placeholder="Tìm theo kỹ năng hoặc kỹ năng tiên quyết..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {hasActiveFilter && (
          <button type="button" className="btn-secondary" onClick={() => setSearch('')}>Xóa lọc</button>
        )}
      </div>

      <div className="data-table-wrap">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kỹ năng</th>
                <th>Yêu cầu (học trước)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPrerequisites.map((item) => (
                <tr key={item.id}>
                  <td>{item.skillName}</td>
                  <td>{item.prerequisiteSkillName}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn-secondary danger-action"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredPrerequisites.length && (
                <tr>
                  <td colSpan={3}>
                    <p className="empty-state">
                      {prerequisites.length ? 'Không có tiên quyết nào khớp bộ lọc.' : 'Chưa có tiên quyết nào.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
