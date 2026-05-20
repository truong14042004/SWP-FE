function getInitials(name) {
  if (!name) return 'M';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'M';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MentorReviewQueue({
  reviewQueue,
  loading,
  onSelectStudent,
  onWriteFeedback,
}) {
  return (
    <>
      <header className="imentor-hero">
        <p className="imentor-hero-eyebrow">Review Queue</p>
        <h1 className="imentor-hero-title">
          {reviewQueue.length} sinh viên đang chờ review
        </h1>
        <p className="imentor-hero-lede">
          Sắp xếp theo thời gian publish portfolio mới nhất. Click vào sinh viên để xem
          chi tiết portfolio + GitHub repos, hoặc gửi feedback nhanh từ card.
        </p>
      </header>

      {loading ? (
        <div className="imentor-loading">Đang tải review queue...</div>
      ) : reviewQueue.length === 0 ? (
        <div className="imentor-empty">
          <p className="imentor-empty-title">Queue trống</p>
          <p className="imentor-empty-hint">
            Hiện chưa có sinh viên nào publish portfolio. Quay lại sau nhé.
          </p>
        </div>
      ) : (
        <div className="imentor-card-grid">
          {reviewQueue.map((s) => (
            <article key={s.id} className="imentor-card">
              <div className="imentor-card-row">
                <div
                  className="imentor-avatar"
                  style={
                    s.avatarUrl
                      ? { backgroundImage: `url(${s.avatarUrl})` }
                      : undefined
                  }
                >
                  {!s.avatarUrl && getInitials(s.fullName)}
                </div>
                <div>
                  <p className="imentor-card-name">{s.fullName}</p>
                  <p className="imentor-card-meta">{s.email}</p>
                </div>
              </div>

              {s.portfolioTitle && (
                <div className="imentor-card-portfolio">
                  <span className="imentor-card-portfolio-label">Portfolio</span>
                  <p className="imentor-card-portfolio-title">{s.portfolioTitle}</p>
                </div>
              )}

              {s.portfolioPublishedAt && (
                <p className="imentor-card-meta" style={{ margin: 0 }}>
                  Publish:{' '}
                  {new Date(s.portfolioPublishedAt).toLocaleDateString('vi-VN')}
                </p>
              )}

              <div className="imentor-card-actions">
                <button
                  type="button"
                  className="imentor-btn-primary"
                  onClick={() => onSelectStudent(s.id)}
                >
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  className="imentor-btn-ghost"
                  onClick={() => onWriteFeedback(s)}
                >
                  Gửi feedback
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
