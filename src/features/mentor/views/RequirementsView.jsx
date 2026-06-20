import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { SectionTitle } from '../../admin/components/DashboardPrimitives';

const emptyRequirement = {
  careerRoleId: '',
  skillId: '',
  requiredLevel: 'Beginner',
  priority: 1,
  weight: 1,
};

const LEVEL_OPTIONS = [
  { value: 'Beginner', label: 'Cơ bản' },
  { value: 'Intermediate', label: 'Trung cấp' },
  { value: 'Advanced', label: 'Nâng cao' },
];

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
  const [deletingId, setDeletingId] = useState('');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  const filteredRequirements = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return requirements.filter((item) => {
      if (keyword) {
        const haystack = [item.skillName, item.careerRoleName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (filterRole && (item.careerRoleName || '') !== filterRole) return false;
      return true;
    });
  }, [requirements, search, filterRole]);

  const hasActiveFilter = Boolean(search) || Boolean(filterRole);

  function resetFilters() {
    setSearch('');
    setFilterRole('');
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
      setFormError(error?.message || 'Không tải được yêu cầu để chỉnh sửa.');
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
      toast.success(editingId ? 'Đã lưu thay đổi yêu cầu.' : 'Đã tạo yêu cầu mới.');
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được yêu cầu.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa yêu cầu kỹ năng "${item.skillName}" của định hướng "${item.careerRoleName}"?`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await onDeleteRequirement(item);
      toast.success('Đã xóa yêu cầu.');
    } catch (error) {
      toast.error(error?.message || 'Không xóa được yêu cầu.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Ánh xạ"
        title="Yêu cầu kỹ năng theo định hướng"
        subtitle={`${filteredRequirements.length}/${requirements.length} ánh xạ`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm yêu cầu
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Sửa yêu cầu' : 'Thêm yêu cầu'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Định hướng nghề</span>
                <select name="careerRoleId" value={form.careerRoleId} onChange={updateField} required>
                  <option value="">Chọn định hướng</option>
                  {careerRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Kỹ năng</span>
                <select name="skillId" value={form.skillId} onChange={updateField} required>
                  <option value="">Chọn kỹ năng</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row three">
              <label>
                <span>Cấp độ yêu cầu</span>
                <select name="requiredLevel" value={form.requiredLevel} onChange={updateField}>
                  {LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Ưu tiên (1–5)</span>
                <input name="priority" type="number" min="1" max="5" value={form.priority} onChange={updateField} />
              </label>
              <label>
                <span>Trọng số</span>
                <input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={updateField} />
              </label>
            </div>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo yêu cầu'}
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
          placeholder="Tìm theo kỹ năng hoặc định hướng..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)}>
          <option value="">Tất cả định hướng</option>
          {careerRoles.map((role) => (
            <option key={role.id} value={role.name}>{role.name}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button type="button" className="btn-secondary" onClick={resetFilters}>Xóa lọc</button>
        )}
      </div>

      <div className="data-table-wrap">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Định hướng nghề</th>
                <th>Kỹ năng</th>
                <th>Cấp độ</th>
                <th>Ưu tiên · Trọng số</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((item) => (
                <tr key={item.id}>
                  <td>{item.careerRoleName}</td>
                  <td>{item.skillName}</td>
                  <td>{item.requiredLevel}</td>
                  <td>{item.priority} · {item.weight}</td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(item)}>Sửa</button>
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
              {!filteredRequirements.length && (
                <tr>
                  <td colSpan={5}>
                    <p className="empty-state">
                      {requirements.length ? 'Không có yêu cầu nào khớp bộ lọc.' : 'Chưa có yêu cầu nào.'}
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
