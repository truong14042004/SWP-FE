import { useEffect, useMemo, useState } from 'react';
import '../../../styles/portfolio.css'
import {
  createPortfolio,
  getMyPortfolio,
  publishPortfolio,
  updatePortfolio,
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

function getPublicUrl(slug) {
  if (!slug) return '';
  return `${window.location.origin}/portfolio/${slug}`;
}

export function StudentPortfolioPage({ session }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [form, setForm] = useState(EMPTY_PORTFOLIO);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadPortfolio();
  }, []);

  const publicUrl = useMemo(() => getPublicUrl(form.slug), [form.slug]);

  async function loadPortfolio() {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const portfolio = await getMyPortfolio(session);
      setForm(normalizePortfolio(portfolio));
      setHasPortfolio(true);
    } catch (requestError) {
      if (requestError?.status === 404) {
        setForm(EMPTY_PORTFOLIO);
        setHasPortfolio(false);
      } else {
        setError(requestError.message || 'Không tải được portfolio.');
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

  async function handleSave() {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = buildPayload(form);
      const saved = hasPortfolio
        ? await updatePortfolio(session, payload)
        : await createPortfolio(session, payload);

      setForm(normalizePortfolio(saved));
      setHasPortfolio(true);
      setNotice(hasPortfolio ? 'Đã cập nhật portfolio.' : 'Đã tạo portfolio.');
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được portfolio.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError('');
    setNotice('');

    try {
      if (!hasPortfolio) {
        const saved = await createPortfolio(session, buildPayload(form));
        setForm(normalizePortfolio(saved));
        setHasPortfolio(true);
      }

      const published = await publishPortfolio(session);
      setForm(normalizePortfolio(published));
      setNotice('Đã xuất bản portfolio.');
      setActiveTab('share');
    } catch (requestError) {
      setError(requestError.message || 'Không xuất bản được portfolio.');
    } finally {
      setPublishing(false);
    }
  }

  async function copyPublicUrl() {
    if (!publicUrl) return;

    await navigator.clipboard?.writeText(publicUrl);
    setNotice('Đã copy link portfolio.');
  }

  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <h1>Xây dựng Portfolio</h1>
          <p>Quản lý và tùy chỉnh hồ sơ năng lực của bạn.</p>
        </div>

        <div className="portfolio-header-actions">
          <button
            type="button"
            className="portfolio-btn outline"
            onClick={() => setActiveTab('preview')}
          >
            👁 Xem trước
          </button>

          <button
            type="button"
            className="portfolio-btn primary"
            onClick={handlePublish}
            disabled={publishing || loading}
          >
            🚀 {publishing ? 'Đang xuất bản...' : 'Xuất bản Portfolio'}
          </button>
        </div>
      </header>

      <nav className="portfolio-tabs">
        <button
          type="button"
          className={activeTab === 'edit' ? 'active' : ''}
          onClick={() => setActiveTab('edit')}
        >
          ✎ Chỉnh sửa
        </button>

        <button
          type="button"
          className={activeTab === 'theme' ? 'active' : ''}
          onClick={() => setActiveTab('theme')}
        >
          🎨 Theme
        </button>

        <button
          type="button"
          className={activeTab === 'share' ? 'active' : ''}
          onClick={() => setActiveTab('share')}
        >
          🔗 Chia sẻ
        </button>
      </nav>

      {error && <div className="portfolio-alert error">{error}</div>}
      {notice && <div className="portfolio-alert success">{notice}</div>}

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
              disabled={!publicUrl}
            >
              Copy link
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

        <label className="portfolio-field">
          <span>GitHub Repository Id</span>
          <input
            value={project.githubRepositoryId}
            onChange={(event) =>
              onChange(project.localId, 'githubRepositoryId', event.target.value)
            }
            placeholder="Có thể bỏ trống"
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

        <label className="portfolio-field span-2">
          <span>Image URL</span>
          <input
            value={project.imageUrl}
            onChange={(event) => onChange(project.localId, 'imageUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>

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
  const projects = form.projects.length
    ? form.projects
    : [
        {
          localId: 'sample',
          title: 'Fintech Dashboard Redesign',
          description:
            'Thiết kế dashboard quản lý tài chính cá nhân, cải thiện trải nghiệm người dùng.',
          techStack: 'React, Figma, Dashboard',
          imageUrl:
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
          demoUrl: '#',
          sourceUrl: '#',
        },
      ];

  return (
    <section className={`portfolio-preview portfolio-preview-${form.theme}`}>
      <div className="portfolio-preview-hero">
        <div>
          <span>Portfolio Preview</span>
          <h2>{form.title || 'Your Career Title'}</h2>
          <p>
            {form.bio ||
              'Giới thiệu ngắn về định hướng nghề nghiệp, kỹ năng và các dự án nổi bật của bạn.'}
          </p>
        </div>
      </div>

      <div className="portfolio-preview-projects">
        {projects.map((project) => (
          <article key={project.localId} className="portfolio-preview-project">
            <img
              src={
                project.imageUrl ||
                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80'
              }
              alt={project.title || 'Project'}
            />

            <div>
              <h3>{project.title || 'Tên dự án'}</h3>
              <p>{project.description || 'Mô tả ngắn về dự án.'}</p>

              <div className="portfolio-preview-tags">
                {parseTechStack(project.techStack).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="portfolio-preview-links">
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer">
                    Live Demo
                  </a>
                )}

                {project.sourceUrl && (
                  <a href={project.sourceUrl} target="_blank" rel="noreferrer">
                    Source
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}