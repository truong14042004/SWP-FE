import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';

const READINESS_LABELS = {
  NotReady: 'Chưa sẵn sàng',
  NeedsImprovement: 'Cần cải thiện',
  Ready: 'Sẵn sàng',
  Excellent: 'Xuất sắc',
};

function readinessLabel(value) {
  return READINESS_LABELS[value] || value;
}

export function MentorFeedbackHistory({ feedbacks, reviewQueue, onSelectStudent }) {
  return (
    <>
      <motion.header
        className="imentor-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <p className="imentor-hero-eyebrow">Lịch sử feedback</p>
        <h1 className="imentor-hero-title">{feedbacks.length} review đã gửi</h1>
        <p className="imentor-hero-lede">
          Tất cả feedback structured bạn đã gửi cho sinh viên. Click vào một mục để xem
          lại bối cảnh portfolio.
        </p>
      </motion.header>

      {feedbacks.length === 0 ? (
        <div className="imentor-empty">
          <p className="imentor-empty-title">Chưa có feedback nào</p>
          <p className="imentor-empty-hint">
            Mở review queue để bắt đầu đánh giá sinh viên đầu tiên.
          </p>
        </div>
      ) : (
        <section className="imentor-detail-section" style={{ padding: '24px 24px' }}>
          <Fades holdDelay={30} inView={true}>
            {feedbacks.map((f) => {
              const student = reviewQueue.find((s) => s.id === f.studentId);
              const readinessClass = f.jobReadinessLevel
                ? f.jobReadinessLevel.toLowerCase()
                : '';
              return (
                <motion.div
                  key={f.id}
                  className="imentor-feedback-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectStudent(f.studentId)}
                  whileHover={{
                    x: 8,
                    backgroundColor: 'rgba(0, 102, 204, 0.02)',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 102, 204, 0.04)',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                >
                  <div className="imentor-feedback-head">
                    <strong>{f.studentFullName}</strong>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {f.rating != null && (
                        <span className="imentor-feedback-rating">
                          <strong>{f.rating}</strong>/5
                        </span>
                      )}
                      {f.jobReadinessLevel && (
                        <span className={`imentor-feedback-readiness ${readinessClass}`}>
                          {readinessLabel(f.jobReadinessLevel)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="imentor-feedback-comment">{f.comment}</p>

                  {(f.portfolioQualityFeedback ||
                    f.technicalSkillsAssessment ||
                    f.projectQualityFeedback ||
                    f.recommendations) && (
                    <div className="imentor-feedback-fields">
                      {f.portfolioQualityFeedback && (
                        <div className="imentor-feedback-field">
                          <div className="imentor-feedback-field-label">
                            Chất lượng portfolio
                          </div>
                          <div className="imentor-feedback-field-value">
                            {f.portfolioQualityFeedback}
                          </div>
                        </div>
                      )}
                      {f.technicalSkillsAssessment && (
                        <div className="imentor-feedback-field">
                          <div className="imentor-feedback-field-label">
                            Kỹ năng kỹ thuật
                          </div>
                          <div className="imentor-feedback-field-value">
                            {f.technicalSkillsAssessment}
                          </div>
                        </div>
                      )}
                      {f.projectQualityFeedback && (
                        <div className="imentor-feedback-field">
                          <div className="imentor-feedback-field-label">
                            Chất lượng dự án
                          </div>
                          <div className="imentor-feedback-field-value">
                            {f.projectQualityFeedback}
                          </div>
                        </div>
                      )}
                      {f.recommendations && (
                        <div className="imentor-feedback-field">
                          <div className="imentor-feedback-field-label">
                            Đề xuất cải thiện
                          </div>
                          <div className="imentor-feedback-field-value">
                            {f.recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="imentor-feedback-time">
                    {new Date(f.createdAt).toLocaleString('vi-VN')}
                    {student?.portfolioTitle && ` · ${student.portfolioTitle}`}
                  </span>
                </motion.div>
              );
            })}
          </Fades>
        </section>
      )}
    </>
  );
}
