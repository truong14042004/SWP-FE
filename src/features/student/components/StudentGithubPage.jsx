import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Command, LoaderCircle } from 'lucide-react';
import '../../../styles/github.css';
import {
  analyzeGithubReadme,
  getGithubConnection,
  getGithubRepositories,
  handleGithubCallback,
  startGithubLogin,
  syncGithubRepositories,
} from '../githubApi';
import { getStudentProfile } from '../studentApi';
const EMPTY_ANALYZE_FORM = {
  repoUrl: '',
  readmeContent: '',
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampScore(value) {
  const score = Number(value || 0);

  if (score < 0) return 0;
  if (score > 100) return 100;

  return score;
}
function normalizeGithubUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}
function formatDate(value) {
  if (!value) return 'Chưa đồng bộ';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
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

function parseJsonObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function parseRepoAnalysis(repo) {
  return parseJsonObject(repo.aiSummary) || {};
}

function parseRepoTechData(repo) {
  return parseJsonObject(repo.techStackJson) || {};
}

function getRepoTechStack(repo) {
  const analysis = parseRepoAnalysis(repo);
  const techData = parseRepoTechData(repo);
  const values = [
    ...safeArray(analysis.techStack),
    ...safeArray(techData.technologies),
    ...Object.keys(techData.languages || {}),
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => !['Không xác định', 'KhĂ´ng xĂ¡c Ä‘á»‹nh'].includes(item));

  return Array.from(new Set(values));
}

function getRepoPurpose(repo) {
  const analysis = parseRepoAnalysis(repo);
  return repo.description || analysis.projectPurpose || 'Chưa có mô tả repository.';
}

function getRepoSummary(repo) {
  const analysis = parseRepoAnalysis(repo);
  return analysis.codeQuality?.summary || analysis.architecture || getRepoPurpose(repo);
}

function getReadinessScore(repo) {
  const analysis = parseRepoAnalysis(repo);
  return clampScore(analysis.portfolioReadinessScore ?? repo.qualityScore);
}

function getAnalyzedFiles(repo) {
  const techData = parseRepoTechData(repo);
  const analysis = parseRepoAnalysis(repo);
  return [
    ...safeArray(techData.analyzedFiles).map((file) => file.Path || file.path || file.name),
    ...safeArray(analysis.evidence?.filesReviewed),
  ].filter(Boolean);
}

function getRecentCommits(repo) {
  return safeArray(parseRepoTechData(repo).recentCommits);
}

function getRepoName(repo) {
  return repo.repoName || repo.name || 'Repository chưa đặt tên';
}

function getRepoUrl(repo) {
  return repo.repoUrl || repo.htmlUrl || repo.url || '';
}

function getRepoDescription(repo) {
  return repo.description || repo.aiSummary || 'Chưa có mô tả repository.';
}

function getRepoLanguage(repo) {
  return repo.mainLanguage || repo.language || 'Unknown';
}

function getRepoVisibility(repo) {
  if (repo.isPrivate === true || repo.private === true) return 'Private';
  if (repo.visibility) return repo.visibility;
  return 'Public';
}

function getLanguageClass(language) {
  const normalized = String(language || '').toLowerCase();

  if (normalized.includes('java')) return 'java';
  if (normalized.includes('python')) return 'python';
  if (normalized.includes('typescript')) return 'typescript';
  if (normalized.includes('javascript')) return 'javascript';
  if (normalized.includes('c#') || normalized.includes('csharp')) return 'csharp';

  return 'default';
}

export function StudentGithubPage({ session }) {
  const [profile, setProfile] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [username, setUsername] = useState('');
  const [includePrivate, setIncludePrivate] = useState(true);

  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [expandedRepoIds, setExpandedRepoIds] = useState(() => new Set());
  const [analyzeForm, setAnalyzeForm] = useState(EMPTY_ANALYZE_FORM);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyzingRepoId, setAnalyzingRepoId] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const connected = repositories.length > 0 || Boolean(username || profile?.githubUsername);

  const stats = useMemo(() => {
    const total = repositories.length;
    const analyzed = repositories.filter((repo) => Number(repo.qualityScore || 0) > 0).length;

    const average =
      total > 0
        ? Math.round(
            repositories.reduce((sum, repo) => sum + clampScore(repo.qualityScore), 0) / total
          )
        : 0;

    const languages = new Set(
      repositories
        .map((repo) => getRepoLanguage(repo))
        .filter((language) => language && language !== 'Unknown')
    );

    return {
      total,
      analyzed,
      average,
      languages: languages.size,
    };
  }, [repositories]);

  function showError(message) {
    setError(message);
    toast.error(message);
  }

  function showWarning(message) {
    setError(message);
    toast.warn(message);
  }

  async function loadInitialData() {
    setLoading(true);
    setError('');
    try {
      await handlePossibleCallback();

      const [profileResult, repoResult, connectionResult] = await Promise.all([
        getStudentProfile(session).catch(() => null),
        getGithubRepositories(session).catch(() => []),
        getGithubConnection(session).catch(() => null),
      ]);

      setProfile(profileResult);
      const resolvedUsername =
        connectionResult?.githubUsername ||
        profileResult?.githubUsername ||
        '';
      setUsername(resolvedUsername);
      setRepositories(safeArray(repoResult));
    } catch (requestError) {
      showError(requestError.message || 'Không tải được dữ liệu GitHub.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePossibleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error');

    if (!code && !state && !oauthError) return;

    try {
      await handleGithubCallback(session, {
        code,
        state,
        error: oauthError,
      });

      toast.success('Kết nối GitHub thành công.');

      const cleanUrl = `${window.location.origin}${window.location.pathname}#github`;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (requestError) {
      showError(requestError.message || 'Không xử lý được GitHub callback.');
    }
  }

 async function handleConnectGithub() {
  setConnecting(true);
  setError('');

  try {
    const result = await startGithubLogin(session, {
      returnUrl: `${window.location.origin}${window.location.pathname}#github`,
      scope: 'repo read:user user:email',
    });

    const authorizationUrl = result?.authorizationUrl;

    if (!authorizationUrl) {
      showError('API không trả về authorizationUrl.');
      return;
    }

    if (!authorizationUrl.startsWith('https://github.com/login/oauth/authorize')) {
      showError(`authorizationUrl không hợp lệ: ${authorizationUrl}`);
      return;
    }

    window.location.href = authorizationUrl;
  } catch (requestError) {
    showError(requestError.message || 'Không khởi tạo được GitHub OAuth.');
  } finally {
    setConnecting(false);
  }
}

 async function handleSyncGithub() {
  const finalUsername = normalizeGithubUsername(username || profile?.githubUsername);

  if (!finalUsername) {
    showWarning('Vui lòng nhập GitHub username trước khi đồng bộ.');
    return;
  }

  setSyncing(true);
  setError('');

  try {
    const result = await syncGithubRepositories(session, {
      username: finalUsername,
      includePrivate,
    });

    setUsername(finalUsername);
    setRepositories(safeArray(result));
    toast.success('Đã đồng bộ repositories từ GitHub.');
  } catch (requestError) {
    showError(requestError.message || 'Không đồng bộ được GitHub repositories.');
  } finally {
    setSyncing(false);
  }
}

  async function handleReloadRepositories() {
    setLoading(true);
    setError('');

    try {
      const result = await getGithubRepositories(session);
      setRepositories(safeArray(result));
      toast.success('Đã tải lại repositories.');
    } catch (requestError) {
      showError(requestError.message || 'Không tải được repositories.');
    } finally {
      setLoading(false);
    }
  }

  function openAnalyzePanel(repo) {
    const repoId = repo.id || '';
    const repoUrl = getRepoUrl(repo);

    setSelectedRepoId((current) => (current === repoId ? '' : repoId));
    setAnalyzeForm({
      repoUrl,
      readmeContent: '',
    });
    setError('');
  }

  function updateAnalyzeForm(event) {
    const { name, value } = event.target;
    setAnalyzeForm((current) => ({ ...current, [name]: value }));
  }

  function toggleRepoDetails(repoId) {
    setExpandedRepoIds((current) => {
      const next = new Set(current);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  }

  async function handleAnalyzeReadme(repo) {
    const repositoryId = repo.id;

    if (!repositoryId) {
      showError('Repository không có ID.');
      return;
    }

    setAnalyzingRepoId(repositoryId);
    setError('');

    try {
      const result = await analyzeGithubReadme(session, {
        repositoryId,
        repoUrl: analyzeForm.repoUrl.trim() || getRepoUrl(repo),
      });

      setRepositories((current) =>
        current.map((item) => (item.id === repositoryId ? result : item))
      );

      setSelectedRepoId('');
      setAnalyzeForm(EMPTY_ANALYZE_FORM);
      toast.success('Đã phân tích README repository.');
    } catch (requestError) {
      showError(requestError.message || 'Không phân tích được README.');
    } finally {
      setAnalyzingRepoId('');
    }
  }

  return (
    <section className="github-page anim-stagger">
      <header className="github-hero anim-fade-up">
        <div className="github-hero-copy">
          <span className={connected ? 'github-status-pill connected' : 'github-status-pill disconnected'}>
            {connected ? 'Connected workspace' : 'Not connected'}
          </span>
          <span className="github-eyebrow">GitHub Integration</span>
          <h1>Tích hợp GitHub</h1>
          <p>Đồng bộ repository để AI đánh giá năng lực lập trình của bạn.</p>

          <div className="github-hero-metrics" aria-label="GitHub summary">
            <div>
              <span>Repositories</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>Analyzed</span>
              <strong>{stats.analyzed}</strong>
            </div>
            <div>
              <span>Average score</span>
              <strong>{stats.average}/100</strong>
            </div>
          </div>
        </div>

        <div className="github-hero-actions">
          <button
            type="button"
            className="github-btn outline"
            onClick={handleConnectGithub}
            disabled={connecting || syncing}
          >
            {connecting ? 'Đang kết nối...' : 'Kết nối GitHub'}
          </button>

          <button
            type="button"
            className="github-btn primary"
            onClick={handleSyncGithub}
            disabled={syncing || connecting}
          >
            {syncing ? 'Đang đồng bộ...' : '↻ Đồng bộ ngay'}
          </button>
        </div>
      </header>

      {error && (
        <div className="github-alert error" role="alert">
          {error}
        </div>
      )}

      <section className={connected ? 'github-connection-card connected' : 'github-connection-card'}>
        <div className="github-connection-icon">‹›</div>

        <div>
          <div className="github-connection-title">
            <h2>{connected ? 'Đã kết nối GitHub' : 'Chưa kết nối GitHub'}</h2>
            <span>{connected ? 'Hoạt động' : 'Chưa hoạt động'}</span>
          </div>

          <p>
            Tài khoản:{' '}
            <strong>
              {username || profile?.githubUsername
                ? `${username || profile?.githubUsername}`
                : 'Chưa có username'}
            </strong>
          </p>
        </div>

        <button type="button" onClick={handleReloadRepositories} disabled={loading}>
          Tải lại
        </button>
      </section>

      <section className="github-sync-card anim-hover-lift">
        <div className="github-sync-copy">
          <h2>Cấu hình đồng bộ</h2>
          <p>
            Nhập GitHub username để đồng bộ repository. Nếu đã OAuth, backend có thể lấy thêm repo private.
          </p>
        </div>

        <div className="github-sync-form">
          <label>
            <span>GitHub username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ví dụ: nguyenvana"
            />
          </label>

          <label className="github-checkbox">
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(event) => setIncludePrivate(event.target.checked)}
            />
            <span>Bao gồm private repositories</span>
          </label>

          <button type="button" onClick={handleSyncGithub} disabled={syncing || connecting}>
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ repositories'}
          </button>
        </div>
      </section>

      <section className="github-stats-grid">
        <article>
          <span>Repositories</span>
          <strong>{stats.total}</strong>
          <small>đã đồng bộ</small>
        </article>

        <article>
          <span>Đã phân tích</span>
          <strong>{stats.analyzed}</strong>
          <small>repo có quality score</small>
        </article>

        <article>
          <span>Điểm trung bình</span>
          <strong>{stats.average}/100</strong>
          <small>AI quality score</small>
        </article>

        <article>
          <span>Ngôn ngữ</span>
          <strong>{stats.languages}</strong>
          <small>main languages</small>
        </article>
      </section>

      <section className="github-repositories-section">
        <div className="github-section-head">
          <div>
            <h2>Repositories đã đồng bộ ({repositories.length})</h2>
            <p>Phân tích README để cập nhật AI summary, tech stack và quality score.</p>
          </div>
        </div>

        {loading ? (
          <div className="github-empty">
            <span><LoaderCircle size={28} aria-hidden="true" /></span>
            <h3>Đang tải repositories</h3>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="github-empty">
            <span><Command size={28} aria-hidden="true" /></span>
            <h3>Chưa có repository</h3>
            <p>Hãy nhập GitHub username và bấm “Đồng bộ repositories”.</p>
          </div>
        ) : (
          <div className="github-repository-grid">
            {repositories.map((repo) => (
              <RepositoryCard
                key={repo.id}
                repo={repo}
                selected={selectedRepoId === repo.id}
                analyzeForm={analyzeForm}
                analyzing={analyzingRepoId === repo.id}
                expanded={expandedRepoIds.has(repo.id)}
                onOpenAnalyze={openAnalyzePanel}
                onAnalyzeFormChange={updateAnalyzeForm}
                onAnalyzeReadme={handleAnalyzeReadme}
                onToggleDetails={toggleRepoDetails}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function RepositoryCard({
  repo,
  selected,
  analyzeForm,
  analyzing,
  expanded,
  onOpenAnalyze,
  onAnalyzeFormChange,
  onAnalyzeReadme,
  onToggleDetails,
}) {
  const repoName = getRepoName(repo);
  const repoUrl = getRepoUrl(repo);
  const analyzed = Boolean(repo.aiSummary || repo.techStackJson || Number(repo.qualityScore || 0) > 0);
  const description = getRepoPurpose(repo);
  const language = getRepoLanguage(repo);
  const languageClass = getLanguageClass(language);
  const visibility = getRepoVisibility(repo);
  const score = clampScore(repo.qualityScore);
  const readinessScore = getReadinessScore(repo);
  const analysis = parseRepoAnalysis(repo);
  const techData = parseRepoTechData(repo);
  const techStack = getRepoTechStack(repo);
  const improvements = safeArray(analysis.priorityImprovements);
  const findings = safeArray(analysis.evidence?.importantFindings);
  const risks = safeArray(analysis.codeQuality?.risks);
  const missingPieces = safeArray(analysis.missingPieces);
  const analyzedFiles = getAnalyzedFiles(repo);
  const recentCommits = getRecentCommits(repo);

  return (
    <article className={[
      'github-repo-card',
      analyzing ? 'loading' : '',
      analyzed ? 'analyzed' : 'not-analyzed',
    ].filter(Boolean).join(' ')}>
      <div className="github-repo-top">
        <div className="github-repo-title">
          <span className="github-folder-icon">⌙</span>
          <div>
            <h3>{repoName}</h3>
            <small>{formatDate(repo.lastSyncedAt || repo.updatedAt || repo.createdAt)}</small>
          </div>
        </div>

        <span className="github-visibility">{visibility}</span>
      </div>

      <p className="github-repo-description">
        {analyzed ? description : 'Repository này chưa được AI phân tích README.'}
      </p>

      <div className="github-repo-meta">
        <span className={`github-language-dot ${languageClass}`} />
        <span>{language}</span>

        {repo.githubAccountLogin && (
          <span className="github-repo-owner">@{repo.githubAccountLogin}</span>
        )}

        {repoUrl && (
          <a href={repoUrl} target="_blank" rel="noreferrer">
            Mở GitHub
          </a>
        )}
      </div>

      {analyzed && techStack.length > 0 && (
        <div className="github-tech-stack">
          {techStack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}

      <div className="github-quality-box">
        <span>{analyzed ? 'Quality Score' : 'Trạng thái'}</span>

        {analyzed ? (
          <div className="github-quality-line">
            <span style={{ width: `${score}%` }} />
          </div>
        ) : (
          <small>Chưa phân tích</small>
        )}

        <strong>{analyzed ? `${score}/100` : '--'}</strong>
      </div>

      {analyzed && (
        <button
          type="button"
          className="github-details-toggle"
          onClick={() => onToggleDetails(repo.id)}
        >
          {expanded ? 'Thu gọn chi tiết' : 'Xem chi tiết phân tích'}
        </button>
      )}

      {analyzed && expanded ? (
        <>
          <div className="github-analysis-grid">
            <div className="github-score-card anim-hover-lift">
              <span>Portfolio readiness</span>
              <strong>{readinessScore}/100</strong>
              <div className="github-quality-line">
                <span style={{ width: `${readinessScore}%` }} />
              </div>
            </div>

            <div className="github-score-card anim-hover-lift">
              <span>Total files</span>
              <strong>{techData.totalFiles ?? analyzedFiles.length ?? 0}</strong>
              <small>{techData.defaultBranch ? `Branch: ${techData.defaultBranch}` : 'Chưa có branch'}</small>
            </div>
          </div>

          {(analysis.projectPurpose || analysis.architecture || analysis.codeQuality?.summary) && (
            <div className="github-ai-summary">
              <span>AI Summary</span>
              <h4>Mục đích dự án</h4>
              <p>{analysis.projectPurpose || description}</p>
              {analysis.architecture && (
                <>
                  <h4>Kiến trúc</h4>
                  <p>{analysis.architecture}</p>
                </>
              )}
              {analysis.codeQuality?.summary && (
                <>
                  <h4>Chất lượng code</h4>
                  <p>{analysis.codeQuality.summary}</p>
                </>
              )}
            </div>
          )}

          {improvements.length > 0 && (
            <div className="github-analysis-section">
              <div className="github-analysis-title">
                <span>Ưu tiên cải thiện</span>
              </div>
              <div className="github-improvement-list">
                {improvements.map((item) => (
                  <article key={`${item.priority}-${item.title}`} className="github-improvement-item">
                    <strong>#{item.priority || '-' } {item.title}</strong>
                    {item.reason && <p>{item.reason}</p>}
                    {item.suggestedAction && <small>{item.suggestedAction}</small>}
                  </article>
                ))}
              </div>
            </div>
          )}

          {(findings.length > 0 || risks.length > 0 || missingPieces.length > 0) && (
            <div className="github-analysis-columns">
              <GithubList title="Findings" items={findings} />
              <GithubList title="Risks" items={risks} />
              <GithubList title="Missing" items={missingPieces} />
            </div>
          )}

          {(analyzedFiles.length > 0 || recentCommits.length > 0) && (
            <div className="github-evidence-panel anim-hover-lift">
              {analyzedFiles.length > 0 && (
                <div>
                  <span>Files reviewed</span>
                  <div className="github-file-list">
                    {Array.from(new Set(analyzedFiles)).map((file) => (
                      <code key={file}>{file}</code>
                    ))}
                  </div>
                </div>
              )}

              {recentCommits.length > 0 && (
                <div>
                  <span>Recent commits</span>
                  <div className="github-commit-list">
                    {recentCommits.slice(0, 3).map((commit) => (
                      <small key={commit.Sha || commit.sha}>
                        <b>{commit.Sha || commit.sha}</b> {commit.Message || commit.message}
                      </small>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : !analyzed ? (
        <div className="github-unanalysed-state">
          <span>Chưa có AI summary</span>
          <p>Dán README hoặc đồng bộ lại repository để AI tạo đánh giá chất lượng và gợi ý cải thiện.</p>
        </div>
      ) : (
        <div className="github-collapsed-summary">
          <span>Đã có phân tích</span>
          <p>{getRepoSummary(repo)}</p>
        </div>
      )}

      <button
        type="button"
        className="github-analyze-btn"
        onClick={() => onOpenAnalyze(repo)}
      >
        {selected ? 'Đóng phân tích' : 'Phân tích README'}
      </button>

      {selected && (
        <div className="github-readme-panel anim-hover-lift">
          <label>
            <span>Repository URL</span>
            <input
              name="repoUrl"
              value={analyzeForm.repoUrl}
              onChange={onAnalyzeFormChange}
              placeholder="https://github.com/user/repo"
            />
          </label>

          <p className="github-analyze-hint">
            AI sẽ tự đọc README và source code từ repository public, bạn không cần dán thủ công.
          </p>

          <button
            type="button"
            onClick={() => onAnalyzeReadme(repo)}
            disabled={analyzing}
          >
            {analyzing ? 'Đang phân tích...' : 'Gửi phân tích'}
          </button>
        </div>
      )}

      {analyzing && (
        <div className="github-card-overlay">
          <span>↻ Đang đồng bộ & phân tích...</span>
        </div>
      )}
    </article>
  );
}

function GithubList({ title, items }) {
  if (!items?.length) return null;

  return (
    <div className="github-finding-list">
      <span>{title}</span>
      <ul>
        {items.slice(0, 5).map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
