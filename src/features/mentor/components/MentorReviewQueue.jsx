import { Button } from '@/components/animate-ui/components/buttons/button';
import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';

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
      <motion.header
        className="imentor-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <p className="imentor-hero-eyebrow">Hàng chờ review</p>
        <h1 className="imentor-hero-title">
          {reviewQueue.length} sinh viên đang chờ review
        </h1>
        <p className="imentor-hero-lede">
          Sắp xếp theo thời gian publish portfolio mới nhất. Click vào sinh viên để xem
          chi tiết portfolio + GitHub repos, hoặc gửi feedback nhanh từ card.
        </p>
      </motion.header>

      {loading ? (
        <div className="imentor-loading">Đang tải review queue...</div>
      ) : reviewQueue.length === 0 ? (
        <div className="imentor-empty">
          <p className="imentor-empty-title">Hàng chờ trống</p>
          <p className="imentor-empty-hint">
            Hiện chưa có sinh viên nào publish portfolio. Quay lại sau nhé.
          </p>
        </div>
      ) : (
        <div className="imentor-card-grid">
          <Fades holdDelay={40} inView={true}>
            {reviewQueue.map((s) => (
              <motion.article
                key={s.id}
                className="imentor-card"
                whileHover={{
                  y: -6,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
                  borderColor: 'var(--imentor-ink-muted)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
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
                    <span className="imentor-card-portfolio-label">Hồ sơ</span>
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
                  <Button
                    type="button"
                    className="imentor-btn-primary"
                    onClick={() => onSelectStudent(s.id)}
                    hoverScale={1.05}
                    tapScale={0.95}
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    type="button"
                    className="imentor-btn-ghost"
                    onClick={() => onWriteFeedback(s)}
                    hoverScale={1.05}
                    tapScale={0.95}
                  >
                    Gửi feedback
                  </Button>
                </div>
              </motion.article>
            ))}
          </Fades>
        </div>
      )}
    </>
  );
}

