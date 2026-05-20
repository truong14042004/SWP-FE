export function MentorFeedbackHistory({ feedbacks, reviewQueue, onSelectStudent }) {
  return (
    <>
      <header className="imentor-hero">
        <p className="imentor-hero-eyebrow">Lịch sử feedback</p>
        <h1 className="imentor-hero-title">{feedbacks.length} review đã gửi</h1>
        <p className="imentor-hero-lede">
          Tất cả feedback structured bạn đã gửi cho sinh viên. Click vào một mục để xem
          lại bối cảnh portfolio.
        </p>
      </header>

      {feedbacks.length === 0 ? (
        <div className="imentor-empty">
          <p className="imentor-empty-title">Chưa có feedback nào</p>
          <p className="imentor-empty-hint">
            Mở review queue để bắt đầu đánh giá sinh viên đầu tiên.
          </p>
        </div>
      ) : (
        <section className="imentor-detail-section">
          {feedbacks.map((f) => {
            const student = reviewQueue.find((s) => s.id === f.studentId);
            const readinessClass = f.jobReadinessLevel
              ? f.jobReadinessLevel.toLowerCase()
              : '';
            return (
              <div
                key={f.id}
                className="imentor-feedback-item"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectStudent(f.studentId)}
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
                        {f.jobReadinessLevel}
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
                          Portfolio quality
                        </div>
                        <div className="imentor-feedback-field-value">
                          {f.portfolioQualityFeedback}
                        </div>
                      </div>
                    )}
                    {f.technicalSkillsAssessment && (
                      <div className="imentor-feedback-field">
                        <div className="imentor-feedback-field-label">
                          Technical skills
                        </div>
                        <div className="imentor-feedback-field-value">
                          {f.technicalSkillsAssessment}
                        </div>
                      </div>
                    )}
                    {f.projectQualityFeedback && (
                      <div className="imentor-feedback-field">
                        <div className="imentor-feedback-field-label">
                          Project quality
                        </div>
                        <div className="imentor-feedback-field-value">
                          {f.projectQualityFeedback}
                        </div>
                      </div>
                    )}
                    {f.recommendations && (
                      <div className="imentor-feedback-field">
                        <div className="imentor-feedback-field-label">
                          Recommendations
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
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
