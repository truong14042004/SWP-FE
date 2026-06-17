import { useState } from 'react';
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
};

function isFileResource(resource) {
  return resource?.sourceType === 'File';
}

function isInternalResourceUrl(url) {
  return typeof url === 'string' && url.startsWith('/api/storage/');
}

function getEditableUrl(resource) {
  if (isFileResource(resource) || isInternalResourceUrl(resource?.url)) return '';
  return resource?.url || '';
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

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function edit(resource) {
    setFormError('');
    setEditingId(resource.id);
    setForm({
      skillId: resource.skillId || '',
      title: resource.title || '',
      url: getEditableUrl(resource),
      resourceType: resource.resourceType || 'Article',
      difficulty: resource.difficulty || '',
      estimatedHours: resource.estimatedHours ?? 0,
      lessonNumber: resource.lessonNumber ?? 1,
      isActive: resource.isActive ?? true,
      file: null,
      hasExistingFile: isFileResource(resource),
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
        difficulty: latest.difficulty || '',
        estimatedHours: latest.estimatedHours || 0,
        lessonNumber: latest.lessonNumber ?? 1,
        isActive: latest.isActive,
        file: null,
        hasExistingFile: isFileResource(latest),
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
    const { hasExistingFile, ...resourceForm } = form;
    const payload = {
      ...resourceForm,
      skillId: form.skillId || null,
      estimatedHours: Number(form.estimatedHours),
      lessonNumber: Number(form.lessonNumber),
    };

    try {
      await onSaveResource(payload, editingId);
      reset();
    } catch (error) {
      setFormError(error?.message || 'Không lưu được tài nguyên.');
    } finally {
      setSaving(false);
    }
  }

  async function openResource(resource) {
    if (!isFileResource(resource)) {
      if (!resource.url) {
        setFormError('No external URL is available for this resource.');
        return;
      }

      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }

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
      setFormError(error?.message || 'Không mở được tài nguyên. Vui lòng thử lại.');
    } finally {
      setOpeningId('');
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Library"
        title="Learning resources"
        subtitle={`${resources.length} resources`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New resource
          </button>
        }
      />

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit resource' : 'New resource'}</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            {formError && <p className="form-error">{formError}</p>}
            <div className="field-row">
              <label>
                <span>Skill</span>
                <select name="skillId" value={form.skillId} onChange={updateField}>
                  <option value="">No skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Title</span>
                <input name="title" value={form.title} onChange={updateField} required />
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>External URL</span>
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
                <span>File upload</span>
                <input
                  name="file"
                  type="file"
                  onChange={updateField}
                />
                {form.file && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>{form.file.name}</small>}
                {editingId && form.hasExistingFile && <small style={{ color: 'var(--ink-muted-48)', display: 'block', marginTop: '4px' }}>Leave URL and file empty to keep the uploaded file.</small>}
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Type</span>
                <select name="resourceType" value={form.resourceType} onChange={updateField} required>
                  <option value="Article">Article (Bài viết)</option>
                  <option value="Video">Video</option>
                  <option value="Course">Course (Khóa học)</option>
                  <option value="Documentation">Documentation (Tài liệu)</option>
                  <option value="Book">Book (Sách)</option>
                  <option value="Exercise">Exercise (Bài tập)</option>
                </select>
              </label>
              <label>
                <span>Difficulty</span>
                <select name="difficulty" value={form.difficulty} onChange={updateField}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Estimated hours</span>
                <input name="estimatedHours" type="number" min="0" value={form.estimatedHours} onChange={updateField} />
              </label>
              <label>
                <span>Lesson number</span>
                <input name="lessonNumber" type="number" min="1" value={form.lessonNumber} onChange={updateField} required />
              </label>
            </div>

            <label className="check-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              <span>Active</span>
            </label>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create resource'}
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
                <th>Resource</th>
                <th>Skill</th>
                <th>Source</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <strong>{resource.title}</strong>
                    <span>Lesson {resource.lessonNumber} · {resource.resourceType} · {formatDate(resource.updatedAt)}</span>
                  </td>
                  <td>{resource.skillName || '—'}</td>
                  <td>{resource.sourceType}</td>
                  <td><StatusPill active={resource.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary text-link" onClick={() => openResource(resource)} disabled={openingId === resource.id}>
                      {openingId === resource.id ? 'Opening...' : 'Open'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => edit(resource)}>Edit</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteResource(resource)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!resources.length && (
                <tr><td colSpan={5}><p className="empty-state">No resources yet.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
