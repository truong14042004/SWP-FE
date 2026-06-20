import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { SectionTitle, StatusPill } from '../../admin/components/DashboardPrimitives';

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
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  const filteredCareerRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return careerRoles;
    return careerRoles.filter((role) => {
      const haystack = [role.name, role.description, role.level]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [careerRoles, search]);

  const hasActiveFilter = Boolean(search);

  async function edit(role) {
    setFormError('');
    try {
      const latest = await onLoadCareerRole(role.id);
      setEditingId(latest.id);
      setForm({
        name: latest.name,
        description: latest.description || '',
        level: latest.level || '',
        isActive: latest.isActive,
      });
      setShowForm(true);
    } catch (error) {
      setFormError(error?.message || 'Không tải được định hướng để chỉnh sửa.');
      setShowForm(true);
    }
  }

  function reset() {
    setEditingId('');
    setForm(emptyCareerRole);
    setFormError('');
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveCareerRole(form, editingId);
      toast.success(editingId ? 'Đã lưu thay đổi định hướng.' : 'Đã tạo định hướng mới.');
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được định hướng.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role) {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn vô hiệu hóa định hướng "${role.name}"? Sinh viên đang theo định hướng này có thể bị ảnh hưởng.`,
    );
    if (!confirmed) return;

    setDeletingId(role.id);
    try {
      await onDeleteCareerRole(role);
      toast.success('Đã cập nhật định hướng.');
    } catch (error) {
      toast.error(error?.message || 'Không cập nhật được định hướng.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Nghề nghiệp"
        title="Định hướng nghề nghiệp"
        subtitle={
          hasActiveFilter
            ? `${filteredCareerRoles.length}/${careerRoles.length} định hướng`
            : `${careerRoles.length} định hướng`
        }
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm định hướng
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Sửa định hướng' : 'Thêm định hướng'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Tên</span>
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label>
                <span>Cấp độ</span>
                <input name="level" value={form.level} onChange={updateField} placeholder="Junior, Mid, Senior…" />
              </label>
            </div>
            <label>
              <span>Mô tả</span>
              <textarea name="description" value={form.description} onChange={updateField} rows={3} />
            </label>
            <label className="check-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              <span>Đang kích hoạt</span>
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo định hướng'}
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
          placeholder="Tìm theo tên, mô tả hoặc cấp độ..."
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
                <th>Định hướng</th>
                <th>Cấp độ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCareerRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    <span>{role.description || 'Chưa có mô tả'}</span>
                  </td>
                  <td>{role.level || '—'}</td>
                  <td><StatusPill active={role.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(role)}>Sửa</button>
                    <button
                      type="button"
                      className="btn-secondary danger-action"
                      onClick={() => handleDelete(role)}
                      disabled={deletingId === role.id}
                    >
                      {deletingId === role.id ? 'Đang xử lý...' : 'Vô hiệu hóa'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredCareerRoles.length && (
                <tr>
                  <td colSpan={4}>
                    <p className="empty-state">
                      {careerRoles.length ? 'Không có định hướng nào khớp bộ lọc.' : 'Chưa có định hướng nào.'}
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
