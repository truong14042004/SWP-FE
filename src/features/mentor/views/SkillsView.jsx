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

const PAGE_SIZE = 10;
const NO_CATEGORY_KEY = '__none__';

export function SkillsView({ skills, onLoadSkill, onSaveSkill, onDeleteSkill }) {
  const [form, setForm] = useState(emptySkill);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  // Bộ lọc + chế độ xem
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [page, setPage] = useState(1);

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

  // Nhóm theo danh mục, mỗi nhóm sắp theo tên
  const groupedSkills = useMemo(() => {
    const groups = new Map();
    filteredSkills.forEach((skill) => {
      const key = skill.category || NO_CATEGORY_KEY;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          categoryName: skill.category || 'Không có danh mục',
          items: [],
        });
      }
      groups.get(key).items.push(skill);
    });
    const result = Array.from(groups.values());
    result.forEach((group) => {
      group.items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return result.sort((a, b) => {
      if (a.key === NO_CATEGORY_KEY) return 1;
      if (b.key === NO_CATEGORY_KEY) return -1;
      return a.categoryName.localeCompare(b.categoryName);
    });
  }, [filteredSkills]);

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSkills = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSkills.slice(start, start + PAGE_SIZE);
  }, [filteredSkills, safePage]);

  const hasActiveFilter = Boolean(search) || Boolean(filterCategory);

  function resetFilters() {
    setSearch('');
    setFilterCategory('');
    setPage(1);
  }

  function renderRowActions(skill) {
    return (
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
    );
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
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
        <select value={filterCategory} onChange={(event) => { setFilterCategory(event.target.value); setPage(1); }}>
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button type="button" className="btn-secondary" onClick={resetFilters}>Xóa lọc</button>
        )}

        <div className="resource-view-toggle">
          <button
            type="button"
            className={viewMode === 'grouped' ? 'is-active' : ''}
            onClick={() => setViewMode('grouped')}
          >
            Theo nhóm
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'is-active' : ''}
            onClick={() => setViewMode('list')}
          >
            Danh sách
          </button>
        </div>
      </div>

      {!filteredSkills.length ? (
        <p className="empty-state">
          {skills.length ? 'Không có kỹ năng nào khớp bộ lọc.' : 'Chưa có kỹ năng nào.'}
        </p>
      ) : viewMode === 'grouped' ? (
        <div className="resource-groups">
          {groupedSkills.map((group) => (
            <div key={group.key} className="resource-group">
              <h4 className="resource-group-title">
                {group.categoryName} <span className="resource-group-count">{group.items.length}</span>
              </h4>
              <div className="data-table-wrap">
                <div className="scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((skill) => (
                        <tr key={skill.id}>
                          <td><strong>{skill.name}</strong></td>
                          <td>{skill.description || 'Chưa có mô tả'}</td>
                          <td><StatusPill active={skill.isActive} /></td>
                          {renderRowActions(skill)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
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
                  {pagedSkills.map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        <strong>{skill.name}</strong>
                        <span>{skill.description || 'Chưa có mô tả'}</span>
                      </td>
                      <td>{skill.category || '—'}</td>
                      <td><StatusPill active={skill.isActive} /></td>
                      {renderRowActions(skill)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="resource-pagination">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
              >
                Trước
              </button>
              <span>Trang {safePage}/{totalPages}</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
