import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { SectionTitle, StatusPill } from '../../admin/components/DashboardPrimitives';

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
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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

  const filteredSkills = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return skills.filter((skill) => {
      if (keyword) {
        const haystack = [skill.name, skill.category, skill.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (filterCategory && skill.category !== filterCategory) return false;
      return true;
    });
  }, [skills, search, filterCategory]);

  const hasActiveFilter = Boolean(search) || Boolean(filterCategory);

  function resetFilters() {
    setSearch('');
    setFilterCategory('');
  }

  async function edit(skill) {
    setFormError('');
    try {
      const latest = await onLoadSkill(skill.id);
      setEditingId(latest.id);
      setForm({
        name: latest.name,
        category: latest.category,
        description: latest.description || '',
        isActive: latest.isActive,
      });
      setShowForm(true);
    } catch (error) {
      setFormError(error?.message || 'Không tải được kỹ năng để chỉnh sửa.');
      setShowForm(true);
    }
  }

  function reset() {
    setEditingId('');
    setForm(emptySkill);
    setFormError('');
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSaveSkill(form, editingId);
      toast.success(editingId ? 'Đã lưu thay đổi kỹ năng.' : 'Đã tạo kỹ năng mới.');
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được kỹ năng.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(skill) {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa kỹ năng "${skill.name}"? Nếu kỹ năng đang được dùng trong lộ trình hoặc tài nguyên, việc xóa có thể ảnh hưởng tới nội dung học.`,
    );
    if (!confirmed) return;

    setDeletingId(skill.id);
    try {
      await onDeleteSkill(skill);
      toast.success('Đã xóa kỹ năng.');
    } catch (error) {
      toast.error(error?.message || 'Không xóa được kỹ năng.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Danh mục"
        title="Kỹ năng"
        subtitle={
          hasActiveFilter
            ? `${filteredSkills.length}/${skills.length} kỹ năng`
            : `${skills.length} kỹ năng`
        }
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm kỹ năng
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Sửa kỹ năng' : 'Tạo kỹ năng mới'}</h3>
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
                <span>Danh mục</span>
                <select name="category" value={form.category} onChange={updateField} required>
                  <option value="">Chọn danh mục</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo kỹ năng'}
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
          placeholder="Tìm theo tên hoặc danh mục..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
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
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map((skill) => (
                <tr key={skill.id}>
                  <td>
                    <strong>{skill.name}</strong>
                    <span>{skill.description || 'Chưa có mô tả'}</span>
                  </td>
                  <td>{skill.category}</td>
                  <td><StatusPill active={skill.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => edit(skill)}>Sửa</button>
                    <button
                      type="button"
                      className="btn-secondary danger-action"
                      onClick={() => handleDelete(skill)}
                      disabled={deletingId === skill.id}
                    >
                      {deletingId === skill.id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredSkills.length && (
                <tr>
                  <td colSpan={4}>
                    <p className="empty-state">
                      {skills.length ? 'Không có kỹ năng nào khớp bộ lọc.' : 'Chưa có kỹ năng nào.'}
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
