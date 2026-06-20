import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { formatDate } from '../../../shared/format';
import { SectionTitle, StatusPill } from '../../admin/components/DashboardPrimitives';

const emptyResource = {
  skillId: '',
  title: '',
  url: '',
  resourceType: 'Article',
  difficulty: 'Beginner',
  estimatedHours: 1,
  lessonNumber: 1,
  isActive: true,
  file: null,
  hasExistingFile: false,
  existingFileLabel: '',
};

const RESOURCE_TYPE_OPTIONS = [
  { value: 'Article', label: 'Bài viết' },
  { value: 'Video', label: 'Video' },
  { value: 'Course', label: 'Khóa học' },
  { value: 'Documentation', label: 'Tài liệu' },
  { value: 'Book', label: 'Sách' },
  { value: 'Exercise', label: 'Bài tập' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'Beginner', label: 'Cơ bản' },
  { value: 'Intermediate', label: 'Trung cấp' },
  { value: 'Advanced', label: 'Nâng cao' },
];

const PAGE_SIZE = 10;
const UNASSIGNED_SKILL_KEY = '__none__';

function resourceTypeLabel(value) {
  return RESOURCE_TYPE_OPTIONS.find((option) => option.value === value)?.label || value || '—';
}

function difficultyLabel(value) {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label || 'Không xác định';
}

function isFileResource(resource) {
  return resource?.sourceType === 'File';
}

function isInternalResourceUrl(url) {
  return typeof url === 'string' && url.startsWith('/api/storage/');
}

function getEditableUrl(resource) {
  if (isInternalResourceUrl(resource?.url)) return '';
  return resource?.url || '';
}

function hasExternalUrl(resource) {
  return Boolean(getEditableUrl(resource));
}

function getSourceLabel(resource) {
  if (hasExternalUrl(resource) && isFileResource(resource)) return 'Link + File';
  if (isFileResource(resource)) return 'File';
  return 'Link';
}

function formatFileSize(size) {
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Number(size);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1) + ' ' + units[unitIndex];
}

function getExistingFileLabel(resource) {
  if (!isFileResource(resource)) return '';
  const fileName = resource.fileName || resource.originalFileName || '';
  const details = [fileName, formatFileSize(resource.fileSize)].filter(Boolean).join(' - ');
  return details ? 'Tệp hiện tại: ' + details : 'Đã tải lên tệp';
}

export function ResourcesView({
  resources,
  skills,
  onLoadResource,
  onOpenResource,
  onSaveResource,
  onDeleteResource,
}) {
  const [form, setForm] = useState(emptyResource);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [openingId, setOpeningId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  // Bộ lọc + chế độ xem
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'active', 'inactive'
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [page, setPage] = useState(1);

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
  }

  const filteredResources = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (keyword) {
        const haystack = [resource.title, resource.skillName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (filterSkill) {
        if (filterSkill === UNASSIGNED_SKILL_KEY) {
          if (resource.skillId) return false;
        } else if (resource.skillId !== filterSkill) {
          return false;
        }
      }
      if (filterType && resource.resourceType !== filterType) return false;
      if (filterDifficulty && (resource.difficulty || '') !== filterDifficulty) return false;
      if (filterStatus === 'active' && !resource.isActive) return false;
      if (filterStatus === 'inactive' && resource.isActive) return false;
      return true;
    });
  }, [resources, search, filterSkill, filterType, filterDifficulty, filterStatus]);

  // Nhóm theo kỹ năng, mỗi nhóm sắp theo số bài học
  const groupedResources = useMemo(() => {
    const groups = new Map();
    filteredResources.forEach((resource) => {
      const key = resource.skillId || UNASSIGNED_SKILL_KEY;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          skillName: resource.skillName || 'Không gắn kỹ năng',
          items: [],
        });
      }
      groups.get(key).items.push(resource);
    });
    const result = Array.from(groups.values());
    result.forEach((group) => {
      group.items.sort((a, b) => {
        const lessonA = a.lessonNumber ?? 0;
        const lessonB = b.lessonNumber ?? 0;
        if (lessonA !== lessonB) return lessonA - lessonB;
        return (a.title || '').localeCompare(b.title || '');
      });
    });
    return result.sort((a, b) => {
      if (a.key === UNASSIGNED_SKILL_KEY) return 1;
      if (b.key === UNASSIGNED_SKILL_KEY) return -1;
      return a.skillName.localeCompare(b.skillName);
    });
  }, [filteredResources]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedResources = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredResources.slice(start, start + PAGE_SIZE);
  }, [filteredResources, safePage]);

  function resetFilters() {
    setSearch('');
    setFilterSkill('');
    setFilterType('');
    setFilterDifficulty('');
    setFilterStatus('');
    setPage(1);
  }

  const hasActiveFilter =
    Boolean(search) || Boolean(filterSkill) || Boolean(filterType) || Boolean(filterDifficulty) || Boolean(filterStatus);

  async function edit(resource) {
    setFormError('');
    setEditingId(resource.id);
    setForm({
      skillId: resource.skillId || '',
      title: resource.title || '',
      url: getEditableUrl(resource),
      resourceType: resource.resourceType || 'Article',
      difficulty: resource.difficulty || 'Beginner',
      estimatedHours: resource.estimatedHours ?? 0,
      lessonNumber: resource.lessonNumber ?? 1,
      isActive: resource.isActive ?? true,
      file: null,
      hasExistingFile: isFileResource(resource),
      existingFileLabel: getExistingFileLabel(resource),
    });
    setShowForm(true);

    try {
      const latest = await onLoadResource(resource.id);
      setEditingId(latest.id);
      setForm({
        skillId: latest.skillId || '',
        title: latest.title,
        url: getEditableUrl(latest),
        resourceType: latest.resourceType,
        difficulty: latest.difficulty || 'Beginner',
        estimatedHours: latest.estimatedHours || 0,
        lessonNumber: latest.lessonNumber ?? 1,
        isActive: latest.isActive,
        file: null,
        hasExistingFile: isFileResource(latest),
        existingFileLabel: getExistingFileLabel(latest),
      });
    } catch (error) {
      setFormError(error?.message || 'Không tải được tài nguyên để chỉnh sửa.');
    }
  }

  function reset() {
    setEditingId('');
    setForm(emptyResource);
    setFormError('');
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const { hasExistingFile, existingFileLabel, ...resourceForm } = form;
    const payload = {
      ...resourceForm,
      skillId: form.skillId || null,
      estimatedHours: Number(form.estimatedHours),
      lessonNumber: Number(form.lessonNumber),
    };

    try {
      await onSaveResource(payload, editingId);
      toast.success(editingId ? 'Đã lưu thay đổi tài nguyên.' : 'Đã tạo tài nguyên mới.');
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được tài nguyên.');
    } finally {
      setSaving(false);
    }
  }

  function openExternalUrl(resource) {
    const externalUrl = getEditableUrl(resource);
    if (!externalUrl) {
      toast.error('Tài nguyên này không có liên kết ngoài.');
      return;
    }
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  }

  async function downloadResourceFile(resource) {
    const targetWindow = window.open('', '_blank', 'noopener,noreferrer');
    setOpeningId(resource.id);
    try {
      const result = await onOpenResource(resource);
      if (targetWindow) {
        targetWindow.location.href = result.url;
      } else {
        window.location.href = result.url;
      }
    } catch (error) {
      targetWindow?.close();
      toast.error(error?.message || 'Không mở được tài nguyên. Vui lòng thử lại.');
    } finally {
      setOpeningId('');
    }
  }

  async function handleDelete(resource) {
    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa tài nguyên "${resource.title}"? Nếu tài nguyên đang nằm trong lộ trình của sinh viên, việc xóa có thể ảnh hưởng tới nội dung học.`,
    );
    if (!confirmed) return;

    setDeletingId(resource.id);
    try {
      await onDeleteResource(resource);
      toast.success('Đã xóa tài nguyên.');
    } catch (error) {
      toast.error(error?.message || 'Không xóa được tài nguyên.');
    } finally {
      setDeletingId('');
    }
  }

  function renderRowActions(resource) {
    return (
      <td className="table-actions">
        <div className="resource-quick-actions" aria-label={'Hành động cho ' + resource.title}>
          {hasExternalUrl(resource) && (
            <button type="button" className="resource-action-chip" onClick={() => openExternalUrl(resource)}>
              Mở liên kết
            </button>
          )}
          {isFileResource(resource) && (
            <button
              type="button"
              className="resource-action-chip"
              onClick={() => downloadResourceFile(resource)}
              disabled={openingId === resource.id}
            >
              {openingId === resource.id ? 'Đang tải...' : 'Tải tệp'}
            </button>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={() => edit(resource)}>Sửa</button>
        <button
          type="button"
          className="btn-secondary danger-action"
          onClick={() => handleDelete(resource)}
          disabled={deletingId === resource.id}
        >
          {deletingId === resource.id ? 'Đang xóa...' : 'Xóa'}
        </button>
      </td>
    );
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Thư viện"
        title="Tài nguyên học tập"
        subtitle={`${filteredResources.length}/${resources.length} tài nguyên`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm tài nguyên
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Sửa tài nguyên' : 'Tài nguyên mới'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Kỹ năng</span>
                <select name="skillId" value={form.skillId} onChange={updateField}>
                  <option value="">Không gắn kỹ năng</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tiêu đề</span>
                <input name="title" value={form.title} onChange={updateField} required />
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Liên kết ngoài</span>
                <input
                  name="url"
                  type="text"
                  value={form.url}
                  onChange={updateField}
                  placeholder="https://..."
                  required={!form.file && !form.hasExistingFile}
                />
              </label>
              <label>
                <span>Tải tệp lên</span>
                <input
                  name="file"
                  type="file"
                  onChange={updateField}
                />
                {form.file && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>Tệp mới: {form.file.name}</small>}
                {!form.file && form.existingFileLabel && <small style={{ color: 'var(--primary)', display: 'block', marginTop: '4px', fontWeight: 600 }}>{form.existingFileLabel}</small>}
                {editingId && form.hasExistingFile && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>Chỉ chọn tệp mới khi muốn thay thế tệp hiện tại.</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Loại</span>
                <select name="resourceType" value={form.resourceType} onChange={updateField} required>
                  {RESOURCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Độ khó</span>
                <select name="difficulty" value={form.difficulty} onChange={updateField}>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Số giờ dự kiến</span>
                <input name="estimatedHours" type="number" min="0" value={form.estimatedHours} onChange={updateField} />
              </label>
              <label>
                <span>Số bài học</span>
                <input name="lessonNumber" type="number" min="1" value={form.lessonNumber} onChange={updateField} required />
              </label>
            </div>

            <label className="check-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              <span>Đang kích hoạt</span>
            </label>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo tài nguyên'}
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
          placeholder="Tìm theo tiêu đề hoặc kỹ năng..."
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
        <select value={filterSkill} onChange={(event) => { setFilterSkill(event.target.value); setPage(1); }}>
          <option value="">Tất cả kỹ năng</option>
          <option value={UNASSIGNED_SKILL_KEY}>Không gắn kỹ năng</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>{skill.name}</option>
          ))}
        </select>
        <select value={filterType} onChange={(event) => { setFilterType(event.target.value); setPage(1); }}>
          <option value="">Tất cả loại</option>
          {RESOURCE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filterDifficulty} onChange={(event) => { setFilterDifficulty(event.target.value); setPage(1); }}>
          <option value="">Tất cả độ khó</option>
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => { setFilterStatus(event.target.value); setPage(1); }}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang kích hoạt</option>
          <option value="inactive">Đã tắt</option>
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
            Theo kỹ năng
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

      {!filteredResources.length ? (
        <p className="empty-state">
          {resources.length ? 'Không có tài nguyên nào khớp bộ lọc.' : 'Chưa có tài nguyên nào.'}
        </p>
      ) : viewMode === 'grouped' ? (
        <div className="resource-groups">
          {groupedResources.map((group) => (
            <div key={group.key} className="resource-group">
              <h4 className="resource-group-title">
                {group.skillName} <span className="resource-group-count">{group.items.length}</span>
              </h4>
              <div className="data-table-wrap">
                <div className="scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bài</th>
                        <th>Tài nguyên</th>
                        <th>Độ khó</th>
                        <th>Nguồn</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((resource) => (
                        <tr key={resource.id}>
                          <td>{resource.lessonNumber}</td>
                          <td>
                            <strong>{resource.title}</strong>
                            <span>{resourceTypeLabel(resource.resourceType)} · {formatDate(resource.updatedAt)}</span>
                          </td>
                          <td>{difficultyLabel(resource.difficulty)}</td>
                          <td>{getSourceLabel(resource)}</td>
                          <td><StatusPill active={resource.isActive} /></td>
                          {renderRowActions(resource)}
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
                    <th>Tài nguyên</th>
                    <th>Kỹ năng</th>
                    <th>Độ khó</th>
                    <th>Nguồn</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedResources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <strong>{resource.title}</strong>
                        <span>Bài {resource.lessonNumber} · {resourceTypeLabel(resource.resourceType)} · {formatDate(resource.updatedAt)}</span>
                      </td>
                      <td>{resource.skillName || '—'}</td>
                      <td>{difficultyLabel(resource.difficulty)}</td>
                      <td>{getSourceLabel(resource)}</td>
                      <td><StatusPill active={resource.isActive} /></td>
                      {renderRowActions(resource)}
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
