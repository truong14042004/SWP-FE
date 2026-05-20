import { useEffect, useState, useMemo } from 'react';
import {
  getStudentPortfolio,
  getStudentGithub,
  getStudentMentorFeedbacks,
  getStudentQuota,
} from '../api/industryMentorApi';

function getInitials(name) {
  if (!name) return 'M';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function parseTechStack(json) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.technologies)) return parsed.technologies;
    if (Array.isArray(parsed.languages)) return Object.keys(parsed.languages || {});
    if (parsed && typeof parsed === 'object' && parsed.languages) {
      return Object.keys(parsed.languages);
    }
    return [];
  } catch {
    return [];
  }
}

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'github', label: 'GitHub' },
  { id: 'feedback', label: 'Feedback đã gửi' },
];

export function MentorStudentDetail({
  session,
  studentId,
  reviewQueue,
  onBack,
  onWriteFeedback,
}) {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [portfolio, setPortfolio] = useState(null);
  const [repos, setRepos] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const student = useMemo(
    () => reviewQueue.find((s) => s.id === studentId) || null,
    [reviewQueue, studentId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [portfolioData, reposData, feedbacksData, quotaData] = await Promise.all([
          getStudentPortfolio(session, studentId).catch(() => null),
          getStudentGithub(session, studentId).catch(() => []),
          getStudentMentorFeedbacks(session, studentId).catch(() => []),
          getStudentQuota(session, studentId).catch(() => null),
        ]);
        if (cancelled) return;
        setPortfolio(portfolioData);
        setRepos(Array.isArray(reposData) ? reposData : []);
        setFeedbacks(Array.isArray(feedbacksData) ? feedbacksData : []);
        setQuota(quotaData);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Không tải được dữ liệu sinh viên');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session, studentId]);

  const quotaClass =
    !quota || quota.remaining > 1
      ? ''
      : quota.remaining === 1
      ? 'is-low'
      : 'is-empty';

  return (
    <>
      <button type="button" className="imentor-detail-back" onClick={onBack}>
        ← Quay lại review queue
      </button>

      <div className="imentor-detail">
        <aside className="imentor-detail-aside">
          <div
            className="imentor-avatar"
            style={
              student?.avatarUrl
                ? { backgroundImage: `url(${student.avatarUrl})`, width: 56, height: 56 }
                : { width: 56, height: 56 }
            }
          >
            {!student?.avatarUrl && getInitials(student?.fullName)}
          </div>
          <h2 className="imentor-detail-aside-name">{student?.fullName || 'Sinh viên'}</h2>
          <p className="imentor-detail-aside-meta">{student?.email}</p>
          {student?.username && (
            <p className="imentor-detail-aside-meta">@{student.username}</p>
          )}

          {quota && (
            <div className={`imentor-detail-aside-quota ${quotaClass}`}>
              <span className="imentor-detail-aside-quota-label">Quota review</span>
              <span className="imentor-detail-aside-quota-value">
                {quota.remaining} / {quota.limit}
              </span>
              <span className="imentor-detail-aside-quota-hint">
                Plan {quota.planName} · đã dùng {quota.used}
              </span>
            </div>
          )}

          <button
            type="button"
            className="imentor-btn-primary"
            disabled={quota?.remaining === 0}
            onClick={() => student && onWriteFeedback(student)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {quota?.remaining === 0 ? 'Hết quota' : 'Gửi feedback mới'}
          </button>
        </aside>

        <div>
          <div className="imentor-detail-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`imentor-detail-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {t.id === 'github' && repos.length > 0 && ` (${repos.length})`}
                {t.id === 'feedback' && feedbacks.length > 0 && ` (${feedbacks.length})`}
              </button>
            ))}
          </div>

          {error && (
            <div className="imentor-empty">
              <p className="imentor-empty-title">Không tải được dữ liệu</p>
              <p className="imentor-empty-hint">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="imentor-loading">Đang tải dữ liệu sinh viên...</div>
          ) : (
            <>
              {activeTab === 'portfolio' && (
                <PortfolioPanel portfolio={portfolio} />
              )}
              {activeTab === 'github' && <GithubPanel repos={repos} />}
              {activeTab === 'feedback' && (
                <FeedbackPanel feedbacks={feedbacks} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function PortfolioPanel({ portfolio }) {
  if (!portfolio) {
    return (
      <div className="imentor-empty">
        <p className="imentor-empty-title">Chưa có portfolio publish</p>
        <p className="imentor-empty-hint">
          Sinh viên cần publish portfolio trước khi mentor có thể review.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="imentor-detail-section">
        <h3 className="imentor-detail-section-title">{portfolio.title}</h3>
        {portfolio.bio && <p className="imentor-portfolio-bio">{portfolio.bio}</p>}
        <p className="imentor-card-meta">
          Slug: <code>{portfolio.slug}</code> · Theme: {portfolio.theme || 'Default'}
        </p>
      </section>

      {portfolio.projects && portfolio.projects.length > 0 ? (
        <section className="imentor-detail-section">
          <h3 className="imentor-detail-section-title">
            Projects ({portfolio.projects.length})
          </h3>
          <div className="imentor-project-list">
            {portfolio.projects.map((p) => {
              const techs = parseTechStack(p.techStackJson);
              return (
                <article key={p.id} className="imentor-project">
                  <h4 className="imentor-project-title">{p.title}</h4>
                  {p.description && (
                    <p className="imentor-project-desc">{p.description}</p>
                  )}
                  {techs.length > 0 && (
                    <div className="imentor-repo-techs">
                      {techs.slice(0, 8).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="imentor-project-links">
                    {p.demoUrl && (
                      <a href={p.demoUrl} target="_blank" rel="noreferrer">
                        Demo →
                      </a>
                    )}
                    {p.sourceUrl && (
                      <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                        Source →
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="imentor-detail-section">
          <p className="imentor-card-meta">Portfolio chưa có project nào.</p>
        </section>
      )}
    </>
  );
}

function GithubPanel({ repos }) {
  if (repos.length === 0) {
    return (
      <div className="imentor-empty">
        <p className="imentor-empty-title">Chưa có repository</p>
        <p className="imentor-empty-hint">
          Sinh viên chưa sync GitHub hoặc chưa có repo public.
        </p>
      </div>
    );
  }

  return (
    <section className="imentor-detail-section">
      <h3 className="imentor-detail-section-title">
        GitHub repositories ({repos.length})
      </h3>
      <div className="imentor-repo-list">
        {repos.map((r) => {
          const techs = parseTechStack(r.techStackJson);
          return (
            <article key={r.id} className="imentor-repo">
              <div className="imentor-repo-head">
                <h4 className="imentor-repo-name">{r.repoName}</h4>
                {r.qualityScore != null && (
                  <span className="imentor-repo-quality">
                    Quality {Math.round(r.qualityScore)}
                  </span>
                )}
              </div>
              {r.description && <p className="imentor-repo-desc">{r.description}</p>}
              {techs.length > 0 && (
                <div className="imentor-repo-techs">
                  {techs.slice(0, 12).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}
              {r.repoUrl && (
                <a
                  className="imentor-repo-link"
                  href={r.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở GitHub →
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FeedbackPanel({ feedbacks }) {
  if (feedbacks.length === 0) {
    return (
      <div className="imentor-empty">
        <p className="imentor-empty-title">Chưa có feedback nào</p>
        <p className="imentor-empty-hint">
          Bạn chưa gửi feedback cho sinh viên này. Click "Gửi feedback mới" để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <section className="imentor-detail-section">
      <h3 className="imentor-detail-section-title">Lịch sử feedback của bạn</h3>
      {feedbacks.map((f) => (
        <FeedbackItem key={f.id} feedback={f} />
      ))}
    </section>
  );
}

function FeedbackItem({ feedback }) {
  const readinessClass = feedback.jobReadinessLevel
    ? feedback.jobReadinessLevel.toLowerCase()
    : '';
  return (
    <div className="imentor-feedback-item">
      <div className="imentor-feedback-head">
        <span className="imentor-feedback-time">
          {new Date(feedback.createdAt).toLocaleString('vi-VN')}
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {feedback.rating != null && (
            <span className="imentor-feedback-rating">
              <strong>{feedback.rating}</strong>/5
            </span>
          )}
          {feedback.jobReadinessLevel && (
            <span className={`imentor-feedback-readiness ${readinessClass}`}>
              {feedback.jobReadinessLevel}
            </span>
          )}
        </div>
      </div>
      <p className="imentor-feedback-comment">{feedback.comment}</p>

      {(feedback.portfolioQualityFeedback ||
        feedback.technicalSkillsAssessment ||
        feedback.projectQualityFeedback ||
        feedback.recommendations) && (
        <div className="imentor-feedback-fields">
          {feedback.portfolioQualityFeedback && (
            <div className="imentor-feedback-field">
              <div className="imentor-feedback-field-label">Portfolio quality</div>
              <div className="imentor-feedback-field-value">
                {feedback.portfolioQualityFeedback}
              </div>
            </div>
          )}
          {feedback.technicalSkillsAssessment && (
            <div className="imentor-feedback-field">
              <div className="imentor-feedback-field-label">Technical skills</div>
              <div className="imentor-feedback-field-value">
                {feedback.technicalSkillsAssessment}
              </div>
            </div>
          )}
          {feedback.projectQualityFeedback && (
            <div className="imentor-feedback-field">
              <div className="imentor-feedback-field-label">Project quality</div>
              <div className="imentor-feedback-field-value">
                {feedback.projectQualityFeedback}
              </div>
            </div>
          )}
          {feedback.recommendations && (
            <div className="imentor-feedback-field">
              <div className="imentor-feedback-field-label">Recommendations</div>
              <div className="imentor-feedback-field-value">
                {feedback.recommendations}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
