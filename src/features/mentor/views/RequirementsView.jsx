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

const PAGE_SIZE = 10;
const UNASSIGNED_ROLE_KEY = '__none__';

function levelLabel(value) {
  return LEVEL_OPTIONS.find((option) => option.value === value)?.label || value || '—';
}

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

  // Bộ lọc + chế độ xem
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [page, setPage] = useState(1);

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

  // Nhóm theo định hướng nghề, mỗi nhóm sắp theo ưu tiên rồi tên kỹ năng
  const groupedRequirements = useMemo(() => {
    const groups = new Map();
    filteredRequirements.forEach((item) => {
      const key = item.careerRoleName || UNASSIGNED_ROLE_KEY;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          careerRoleName: item.careerRoleName || 'Không có định hướng',
          items: [],
        });
      }
      groups.get(key).items.push(item);
    });
    const result = Array.from(groups.values());
    result.forEach((group) => {
      group.items.sort((a, b) => {
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (a.skillName || '').localeCompare(b.skillName || '');
      });
    });
    return result.sort((a, b) => {
      if (a.key === UNASSIGNED_ROLE_KEY) return 1;
      if (b.key === UNASSIGNED_ROLE_KEY) return -1;
      return a.careerRoleName.localeCompare(b.careerRoleName);
    });
  }, [filteredRequirements]);

  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRequirements = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRequirements.slice(start, start + PAGE_SIZE);
  }, [filteredRequirements, safePage]);

  const hasActiveFilter = Boolean(search) || Boolean(filterRole);

  function resetFilters() {
    setSearch('');
    setFilterRole('');
    setPage(1);
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

  function renderRowActions(item) {
    return (
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
    );
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
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
        <select value={filterRole} onChange={(event) => { setFilterRole(event.target.value); setPage(1); }}>
          <option value="">Tất cả định hướng</option>
          {careerRoles.map((role) => (
            <option key={role.id} value={role.name}>{role.name}</option>
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

      {!filteredRequirements.length ? (
        <p className="empty-state">
          {requirements.length ? 'Không có yêu cầu nào khớp bộ lọc.' : 'Chưa có yêu cầu nào.'}
        </p>
      ) : viewMode === 'grouped' ? (
        <div className="resource-groups">
          {groupedRequirements.map((group) => (
            <div key={group.key} className="resource-group">
              <h4 className="resource-group-title">
                {group.careerRoleName} <span className="resource-group-count">{group.items.length}</span>
              </h4>
              <div className="data-table-wrap">
                <div className="scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kỹ năng</th>
                        <th>Cấp độ</th>
                        <th>Ưu tiên · Trọng số</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.skillName}</td>
                          <td>{levelLabel(item.requiredLevel)}</td>
                          <td>{item.priority} · {item.weight}</td>
                          {renderRowActions(item)}
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
                    <th>Định hướng nghề</th>
                    <th>Kỹ năng</th>
                    <th>Cấp độ</th>
                    <th>Ưu tiên · Trọng số</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRequirements.map((item) => (
                    <tr key={item.id}>
                      <td>{item.careerRoleName}</td>
                      <td>{item.skillName}</td>
                      <td>{levelLabel(item.requiredLevel)}</td>
                      <td>{item.priority} · {item.weight}</td>
                      {renderRowActions(item)}
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
