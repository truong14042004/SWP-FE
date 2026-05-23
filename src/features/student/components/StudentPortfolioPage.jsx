import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import '../../../styles/portfolio.css'
import { apiUrl } from '../../../config';
import {
  createPortfolio,
  getMyPortfolio,
  importPortfolioProjectImageFromUrl,
  publishPortfolio,
  unpublishPortfolio,
  updatePortfolio,
  uploadPortfolioProjectImage,
} from '../portfolioApi';

const EMPTY_PROJECT = {
  githubRepositoryId: '',
  title: '',
  description: '',
  techStack: '',
  imageUrl: '',
  demoUrl: '',
  sourceUrl: '',
};

const EMPTY_PORTFOLIO = {
  slug: '',
  title: '',
  bio: '',
  theme: 'modern',
  isPublished: false,
  projects: [],
};

const THEMES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sáng, hiện đại, phù hợp sinh viên IT.',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Nền tối, nổi bật hình ảnh dự án.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Tối giản, tập trung vào nội dung.',
  },
];

function toSlug(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseTechStack(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback comma text
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProject(project = {}, index = 0) {
  return {
    localId: project.id || crypto.randomUUID(),
    id: project.id || '',
    githubRepositoryId: project.githubRepositoryId || '',
    title: project.title || '',
    description: project.description || '',
    techStack: parseTechStack(project.techStackJson).join(', '),
    imageUrl: project.imageUrl || '',
    demoUrl: project.demoUrl || '',
    sourceUrl: project.sourceUrl || '',
    orderIndex: Number.isFinite(Number(project.orderIndex))
      ? Number(project.orderIndex)
      : index,
  };
}

function normalizePortfolio(portfolio) {
  if (!portfolio) return EMPTY_PORTFOLIO;

  return {
    id: portfolio.id || '',
    slug: portfolio.slug || '',
    title: portfolio.title || '',
    bio: portfolio.bio || '',
    theme: portfolio.theme || 'modern',
    isPublished: Boolean(portfolio.isPublished),
    publishedAt: portfolio.publishedAt || null,
    projects: Array.isArray(portfolio.projects)
      ? portfolio.projects
          .map(normalizeProject)
          .sort((a, b) => a.orderIndex - b.orderIndex)
      : [],
  };
}

function buildPayload(form) {
  return {
    slug: toSlug(form.slug || form.title || 'portfolio'),
    title: form.title.trim(),
    bio: form.bio.trim(),
    theme: form.theme,
    projects: form.projects.map((project, index) => ({
      githubRepositoryId: project.githubRepositoryId?.trim() || null,
      title: project.title.trim(),
      description: project.description.trim(),
      techStackJson: JSON.stringify(parseTechStack(project.techStack)),
      imageUrl: project.imageUrl?.trim() || null,
      demoUrl: project.demoUrl?.trim() || null,
      sourceUrl: project.sourceUrl?.trim() || null,
      orderIndex: index,
    })),
  };
}

function ensureAbsoluteUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getPublicUrl(slug) {
  if (!slug) return '';
  return `${window.location.origin}/portfolio/${slug}`;
}

function getFileNameFromUrl(url) {
  return url.split('/').pop()?.split('?')[0] || 'project-image';
}

function getStorageValue(fileInfo, fallback = '') {
  return fileInfo?.downloadPath || fileInfo?.objectName || fallback;
}

function resolveStorageUrl(value) {
  if (!value) return '';

  const normalized = String(value).trim();

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (!apiUrl) {
    return normalized;
  }

  if (normalized.startsWith('/api/storage/public/')) {
    return `${apiUrl}${normalized}`;
  }

  if (normalized.startsWith('api/storage/public/')) {
    return `${apiUrl}/${normalized}`;
  }

  return `${apiUrl}/api/storage/public/${normalized.replace(/^\/+/, '')}/download`;
}

export function StudentPortfolioPage({ session }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [form, setForm] = useState(EMPTY_PORTFOLIO);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const publicUrl = useMemo(() => getPublicUrl(form.slug), [form.slug]);
  const completedProjects = useMemo(() => {
    return form.projects.filter((project) => project.title.trim() && project.description.trim()).length;
  }, [form.projects]);
  const readinessItems = [
    Boolean(form.title.trim()),
    Boolean(form.bio.trim()),
    completedProjects > 0,
    Boolean(form.slug.trim()),
  ];
  const readiness = Math.round((readinessItems.filter(Boolean).length / readinessItems.length) * 100);

  async function loadPortfolio() {
    setLoading(true);
    setError('');

    try {
      const portfolio = await getMyPortfolio(session);
      setForm(normalizePortfolio(portfolio));
      setHasPortfolio(true);
    } catch (requestError) {
      if (requestError?.status === 404) {
        setForm(EMPTY_PORTFOLIO);
        setHasPortfolio(false);
      } else {
        const message = requestError.message || 'Không tải được portfolio.';
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === 'slug' ? toSlug(value) : value,
    }));
  }

  function updateTitle(event) {
    const title = event.target.value;

    setForm((current) => ({
      ...current,
      title,
      slug: current.slug || toSlug(title),
    }));
  }

  function addProject() {
    setForm((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          ...EMPTY_PROJECT,
          localId: crypto.randomUUID(),
          orderIndex: current.projects.length,
        },
      ],
    }));
  }

  function updateProject(localId, field, value) {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.localId === localId
          ? { ...project, [field]: value }
          : project
      ),
    }));
  }

  function removeProject(localId) {
    setForm((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.localId !== localId),
    }));
  }

  function moveProject(localId, direction) {
    setForm((current) => {
      const projects = [...current.projects];
      const index = projects.findIndex((project) => project.localId === localId);
      const nextIndex = direction === 'up' ? index - 1 : index + 1;

      if (index < 0 || nextIndex < 0 || nextIndex >= projects.length) {
        return current;
      }

      [projects[index], projects[nextIndex]] = [projects[nextIndex], projects[index]];

      return { ...current, projects };
    });
  }

  // Make sure the portfolio + every project has an ID so child uploads can target them.
  // Returns the up-to-date project object (with `id`) for the given localId, or null on failure.
  async function ensureProjectPersisted(localId) {
    const targetIndex = form.projects.findIndex((p) => p.localId === localId);
    if (targetIndex < 0) return null;

    const existing = form.projects[targetIndex];
    if (existing.id) return existing;

    setSaving(true);
    try {
      const payload = buildPayload(form);
      const saved = hasPortfolio
        ? await updatePortfolio(session, payload)
        : await createPortfolio(session, payload);

      const normalized = normalizePortfolio(saved);
      setForm(normalized);
      setHasPortfolio(true);

      // Map back by orderIndex (server preserves the input order in the response).
      const persisted = normalized.projects[targetIndex];
      if (persisted?.id) {
        return { ...persisted, localId };
      }
      return null;
    } catch (requestError) {
      const message = requestError.message || 'Không lưu được portfolio.';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleProjectImageFileChange(project, event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    let target = project;
    if (!target.id) {
      const persisted = await ensureProjectPersisted(project.localId);
      if (!persisted) return;
      target = persisted;
    }

    setUploadingProjectId(target.localId);
    setError('');
    try {
      const uploaded = await uploadPortfolioProjectImage(session, target.id, file);
      updateProject(target.localId, 'imageUrl', getStorageValue(uploaded, target.imageUrl));
      setNotice('Đã upload ảnh dự án.');
      toast.success('Đã upload ảnh dự án.');
    } catch (requestError) {
      const message = requestError.message || 'Không upload được ảnh dự án.';
      setError(message);
      toast.error(message);
    } finally {
      setUploadingProjectId('');
    }
  }

  async function handleProjectImageImport(project) {
    const url = project.imageUrl.trim();

    if (!url) {
      return;
    }

    let target = project;
    if (!target.id) {
      const persisted = await ensureProjectPersisted(project.localId);
      if (!persisted) return;
      target = { ...persisted, imageUrl: url };
    }

    setUploadingProjectId(target.localId);
    setError('');
    try {
      const imported = await importPortfolioProjectImageFromUrl(session, target.id, {
        url,
        fileName: getFileNameFromUrl(url),
      });
      updateProject(target.localId, 'imageUrl', getStorageValue(imported, url));
      setNotice('Đã import ảnh từ URL.');
      toast.success('Đã import ảnh từ URL.');
    } catch (requestError) {
      const message = requestError.message || 'Không import được ảnh dự án.';
      setError(message);
      toast.error(message);
    } finally {
      setUploadingProjectId('');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload(form);
      const saved = hasPortfolio
        ? await updatePortfolio(session, payload)
        : await createPortfolio(session, payload);

      setForm(normalizePortfolio(saved));
      setHasPortfolio(true);
      toast.success(hasPortfolio ? 'Đã cập nhật portfolio.' : 'Đã tạo portfolio.');
    } catch (requestError) {
      const message = requestError.message || 'Không lưu được portfolio.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError('');

    try {
      if (!hasPortfolio) {
        const saved = await createPortfolio(session, buildPayload(form));
        setForm(normalizePortfolio(saved));
        setHasPortfolio(true);
      }

      const published = await publishPortfolio(session);
      setForm(normalizePortfolio(published));
      toast.success('Đã xuất bản portfolio.');
      setActiveTab('share');
    } catch (requestError) {
      const message = requestError.message || 'Không xuất bản được portfolio.';
      setError(message);
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!hasPortfolio || !form.isPublished) return;

    setUnpublishing(true);
    setError('');

    try {
      const unpublished = await unpublishPortfolio(session);
      setForm(normalizePortfolio(unpublished));
      toast.success('Đã hủy xuất bản portfolio.');
    } catch (requestError) {
      const message = requestError.message || 'Không hủy xuất bản được portfolio.';
      setError(message);
      toast.error(message);
    } finally {
      setUnpublishing(false);
    }
  }

  async function copyPublicUrl() {
    if (!publicUrl) return;

    await navigator.clipboard?.writeText(publicUrl);
    toast.success('Đã copy link portfolio.');
  }

  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <div className="portfolio-header-copy">
          <span className={form.isPublished ? 'portfolio-status-pill live' : 'portfolio-status-pill draft'}>
            {form.isPublished ? 'Đang public' : 'Bản nháp'}
          </span>
          <h1>Xây dựng Portfolio</h1>
          <p>Quản lý và tùy chỉnh hồ sơ năng lực của bạn.</p>
          <div className="portfolio-hero-metrics">
            <div>
              <span>Mức hoàn thiện</span>
              <strong>{readiness}%</strong>
            </div>
            <div>
              <span>Dự án đủ nội dung</span>
              <strong>{completedProjects}/{form.projects.length}</strong>
            </div>
            <div>
              <span>Theme</span>
              <strong>{form.theme}</strong>
            </div>
          </div>
        </div>

        <div className="portfolio-header-actions">
          <button
            type="button"
            className="portfolio-btn outline"
            onClick={() => setActiveTab('preview')}
          >
             Xem trước
          </button>

          <button
            type="button"
            className="portfolio-btn primary"
            onClick={handlePublish}
            disabled={publishing || unpublishing || loading}
          >
             {publishing ? 'Đang xuất bản...' : 'Xuất bản Portfolio'}
          </button>
        </div>
      </header>

      <nav className="portfolio-tabs">
        <button
          type="button"
          className={activeTab === 'edit' ? 'active' : ''}
          onClick={() => setActiveTab('edit')}
        >
           Chỉnh sửa
        </button>

        <button
          type="button"
          className={activeTab === 'theme' ? 'active' : ''}
          onClick={() => setActiveTab('theme')}
        >
           Theme
        </button>

        <button
          type="button"
          className={activeTab === 'share' ? 'active' : ''}
          onClick={() => setActiveTab('share')}
        >
           Chia sẻ
        </button>
      </nav>

      {error && <div className="portfolio-alert error">{error}</div>}

      {loading && (
        <div className="portfolio-card">
          Đang tải portfolio...
        </div>
      )}

      {!loading && activeTab === 'edit' && (
        <div className="portfolio-editor-grid">
          <section className="portfolio-card">
            <h2>Thông tin cơ bản</h2>

            <label className="portfolio-field">
              <span>Tiêu đề nghề nghiệp</span>
              <input
                value={form.title}
                onChange={updateTitle}
                placeholder="Ví dụ: Backend Developer Intern"
              />
            </label>

            <label className="portfolio-field">
              <span>Slug public</span>
              <div className="portfolio-slug-input">
                <span>/portfolio/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={updateField}
                  placeholder="nguyen-van-a"
                />
              </div>
            </label>

            <label className="portfolio-field">
              <span>Giới thiệu ngắn</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={updateField}
                rows={7}
                placeholder="Giới thiệu định hướng nghề nghiệp, kỹ năng chính và mục tiêu của bạn..."
              />
            </label>

            <label className="portfolio-field">
              <span>Theme</span>
              <select name="theme" value={form.theme} onChange={updateField}>
                {THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="portfolio-btn primary full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : hasPortfolio ? 'Lưu thay đổi' : 'Tạo portfolio'}
            </button>
          </section>

          <section className="portfolio-card">
            <div className="portfolio-card-head">
              <div>
                <h2>Dự án nổi bật</h2>
                <p>Thêm 2-4 dự án tốt nhất. Nên có demo hoặc source code.</p>
              </div>

              <button type="button" className="portfolio-btn soft" onClick={addProject}>
                ＋ Thêm dự án
              </button>
            </div>

            {form.projects.length === 0 ? (
              <div className="portfolio-empty">
                <strong>Chưa có dự án nào</strong>
                <p>Bấm “Thêm dự án” để bắt đầu xây dựng portfolio.</p>
              </div>
            ) : (
              <div className="portfolio-project-list">
                {form.projects.map((project, index) => (
                  <ProjectEditor
                    key={project.localId}
                    project={project}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === form.projects.length - 1}
                    onChange={updateProject}
                    onRemove={removeProject}
                    onMove={moveProject}
                    onImageFileChange={handleProjectImageFileChange}
                    onImageImport={handleProjectImageImport}
                    uploadingImage={uploadingProjectId === project.localId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {!loading && activeTab === 'theme' && (
        <section className="portfolio-card">
          <h2>Chọn giao diện portfolio</h2>

          <div className="portfolio-theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`portfolio-theme-card ${form.theme === theme.id ? 'active' : ''}`}
                onClick={() => setForm((current) => ({ ...current, theme: theme.id }))}
              >
                <span className={`portfolio-theme-preview ${theme.id}`} />
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="portfolio-btn primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu theme'}
          </button>
        </section>
      )}

      {!loading && activeTab === 'share' && (
        <section className="portfolio-card">
          <h2>Chia sẻ portfolio</h2>

          <div className="portfolio-public-box">
            <div>
              <span>Public URL</span>
              <strong>{publicUrl || 'Chưa có slug'}</strong>
            </div>

            <button
              type="button"
              className="portfolio-btn soft"
              onClick={copyPublicUrl}
              disabled={!publicUrl || !form.isPublished}
            >
              Copy link
            </button>

            <button
              type="button"
              className="portfolio-btn outline"
              onClick={handleUnpublish}
              disabled={!form.isPublished || unpublishing || publishing}
            >
              {unpublishing ? 'Đang hủy xuất bản...' : 'Hủy xuất bản'}
            </button>
          </div>

          <div className="portfolio-status-grid">
            <div>
              <span>Trạng thái</span>
              <strong>{form.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</strong>
            </div>

            <div>
              <span>Số dự án</span>
              <strong>{form.projects.length}</strong>
            </div>

            <div>
              <span>Theme</span>
              <strong>{form.theme}</strong>
            </div>
          </div>
        </section>
      )}

      {!loading && activeTab === 'preview' && (
        <PortfolioPreview form={form} />
      )}
    </section>
  );
}

function ProjectEditor({
  project,
  index,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
  onImageFileChange,
  onImageImport,
  uploadingImage,
}) {
  const tags = parseTechStack(project.techStack);

  return (
    <article className="portfolio-project-editor">
      <div className="portfolio-project-head">
        <div>
          <span>Dự án #{index + 1}</span>
          <h3>{project.title || 'Dự án chưa đặt tên'}</h3>
        </div>

        <div className="portfolio-project-actions">
          <button type="button" onClick={() => onMove(project.localId, 'up')} disabled={isFirst}>
            ↑
          </button>
          <button type="button" onClick={() => onMove(project.localId, 'down')} disabled={isLast}>
            ↓
          </button>
          <button type="button" className="danger" onClick={() => onRemove(project.localId)}>
            Xóa
          </button>
        </div>
      </div>

      <div className="portfolio-project-form">
        <label className="portfolio-field">
          <span>Tên dự án</span>
          <input
            value={project.title}
            onChange={(event) => onChange(project.localId, 'title', event.target.value)}
            placeholder="Ví dụ: Job Matching Dashboard"
          />
        </label>

        <label className="portfolio-field span-2">
          <span>Mô tả</span>
          <textarea
            value={project.description}
            onChange={(event) => onChange(project.localId, 'description', event.target.value)}
            rows={3}
            placeholder="Mô tả bài toán, tính năng chính, vai trò của bạn..."
          />
        </label>

        <label className="portfolio-field span-2">
          <span>Tech stack, cách nhau bằng dấu phẩy</span>
          <input
            value={project.techStack}
            onChange={(event) => onChange(project.localId, 'techStack', event.target.value)}
            placeholder="React, Node.js, SQL Server"
          />

          {tags.length > 0 && (
            <div className="portfolio-tag-preview">
              {tags.map((tag) => (
                <small key={tag}>{tag}</small>
              ))}
            </div>
          )}
        </label>

        <div className="portfolio-image-block span-2">
          <div className="portfolio-image-block-head">
            <span>Ảnh dự án</span>
            <small>JPEG / PNG / WebP / GIF</small>
          </div>

          {project.imageUrl && (
            <div className="portfolio-image-preview">
              <img src={resolveStorageUrl(project.imageUrl)} alt={project.title || 'Project'} />
              <button
                type="button"
                className="portfolio-image-remove"
                onClick={() => onChange(project.localId, 'imageUrl', '')}
              >
                Xóa ảnh
              </button>
            </div>
          )}

          <div className="portfolio-image-actions">
            <label className="portfolio-image-upload">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => onImageFileChange(project, event)}
                disabled={uploadingImage}
              />
              {uploadingImage ? 'Đang tải...' : project.imageUrl ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
            </label>
          </div>

          <details className="portfolio-image-advanced">
            <summary>Hoặc dán URL ảnh có sẵn</summary>
            <div className="portfolio-image-url-row">
              <input
                type="url"
                value={project.imageUrl}
                onChange={(event) => onChange(project.localId, 'imageUrl', event.target.value)}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => onImageImport(project)}
                disabled={uploadingImage || !project.imageUrl.trim()}
              >
                Import
              </button>
            </div>
          </details>
        </div>

        <label className="portfolio-field">
          <span>Demo URL</span>
          <input
            value={project.demoUrl}
            onChange={(event) => onChange(project.localId, 'demoUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="portfolio-field">
          <span>Source URL</span>
          <input
            value={project.sourceUrl}
            onChange={(event) => onChange(project.localId, 'sourceUrl', event.target.value)}
            placeholder="https://github.com/..."
          />
        </label>
      </div>
    </article>
  );
}

function PortfolioPreview({ form }) {
  const hasProjects = form.projects.length > 0;

  return (
    <section className={`portfolio-preview portfolio-preview-${form.theme}`}>
      <div className="portfolio-preview-hero">
        <div>
          <span>Portfolio Preview</span>
          <h2>{form.title || 'Chưa đặt tiêu đề nghề nghiệp'}</h2>
          <p>
            {form.bio || 'Chưa có giới thiệu. Hãy thêm ở tab Chỉnh sửa.'}
          </p>
        </div>
      </div>

      {!hasProjects && (
        <div className="portfolio-empty">
          <strong>Chưa có dự án nào</strong>
          <p>Quay lại tab “Chỉnh sửa” để thêm dự án đầu tiên vào portfolio.</p>
        </div>
      )}

      {hasProjects && (
        <div className="portfolio-preview-projects">
          {form.projects.map((project) => {
            const imageSrc = resolveStorageUrl(project.imageUrl);
            return (
              <article key={project.localId} className="portfolio-preview-project">
                {imageSrc && <img src={imageSrc} alt={project.title || 'Dự án'} />}

                <div>
                  <h3>{project.title || 'Dự án chưa đặt tên'}</h3>
                  <p>{project.description || 'Chưa có mô tả.'}</p>

                  <div className="portfolio-preview-tags">
                    {parseTechStack(project.techStack).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <div className="portfolio-preview-links">
                    {project.demoUrl && (
                      <a href={ensureAbsoluteUrl(project.demoUrl)} target="_blank" rel="noreferrer">
                        Live Demo
                      </a>
                    )}

                    {project.sourceUrl && (
                      <a href={ensureAbsoluteUrl(project.sourceUrl)} target="_blank" rel="noreferrer">
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
