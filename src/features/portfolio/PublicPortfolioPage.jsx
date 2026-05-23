import { useEffect, useState } from 'react';
import { apiUrl } from '../../config';
import '../../styles/portfolio.css';

function parseTechStack(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallthrough
  }
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function resolveStorageUrl(value) {
  if (!value) return '';
  const normalized = String(value).trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (!apiUrl) return normalized;
  if (normalized.startsWith('/api/storage/public/')) return `${apiUrl}${normalized}`;
  if (normalized.startsWith('api/storage/public/')) return `${apiUrl}/${normalized}`;
  return `${apiUrl}/api/storage/public/${normalized.replace(/^\/+/, '')}/download`;
}

function ensureAbsoluteUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function PublicPortfolioPage({ slug, onHome }) {
  const [portfolio, setPortfolio] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | not-found | error

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`${apiUrl}/api/portfolio/${encodeURIComponent(slug)}`);
        if (cancelled) return;

        if (response.status === 404) {
          setStatus('not-found');
          return;
        }
        if (!response.ok) {
          setStatus('error');
          return;
        }

        const data = await response.json();
        setPortfolio(data);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return (
      <main className="portfolio-public-shell">
        <div className="portfolio-public-state">Đang tải portfolio...</div>
      </main>
    );
  }

  if (status === 'not-found') {
    return (
      <main className="portfolio-public-shell">
        <div className="portfolio-public-state">
          <h1>Không tìm thấy portfolio</h1>
          <p>Portfolio này có thể chưa được xuất bản hoặc đã bị xoá.</p>
          <button type="button" onClick={onHome}>Về trang chủ</button>
        </div>
      </main>
    );
  }

  if (status === 'error' || !portfolio) {
    return (
      <main className="portfolio-public-shell">
        <div className="portfolio-public-state">
          <h1>Lỗi tải portfolio</h1>
          <p>Hãy thử tải lại trang sau ít phút.</p>
          <button type="button" onClick={onHome}>Về trang chủ</button>
        </div>
      </main>
    );
  }

  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : [];

  return (
    <main className={`portfolio-preview portfolio-preview-${portfolio.theme || 'modern'} portfolio-public-shell`}>
      <div className="portfolio-preview-hero">
        <div>
          <span>Portfolio</span>
          <h2>{portfolio.title || 'Untitled portfolio'}</h2>
          <p>{portfolio.bio || ''}</p>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="portfolio-empty">
          <strong>Chưa có dự án</strong>
          <p>Chủ portfolio chưa thêm dự án nào.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="portfolio-preview-projects">
          {projects.map((project) => {
            const imageSrc = resolveStorageUrl(project.imageUrl);
            const tags = parseTechStack(project.techStackJson || project.techStack);
            return (
              <article key={project.id || project.title} className="portfolio-preview-project">
                {imageSrc && <img src={imageSrc} alt={project.title || 'Dự án'} />}
                <div>
                  <h3>{project.title || 'Dự án'}</h3>
                  <p>{project.description}</p>
                  {tags.length > 0 && (
                    <div className="portfolio-preview-tags">
                      {tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  )}
                  <div className="portfolio-preview-links">
                    {project.demoUrl && (
                      <a href={ensureAbsoluteUrl(project.demoUrl)} target="_blank" rel="noreferrer">Live Demo</a>
                    )}
                    {project.sourceUrl && (
                      <a href={ensureAbsoluteUrl(project.sourceUrl)} target="_blank" rel="noreferrer">Source</a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="portfolio-public-footer">
        <button type="button" onClick={onHome}>Về SWP Career</button>
      </footer>
    </main>
  );
}
