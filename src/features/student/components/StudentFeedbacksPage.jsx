import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { authorizedRequest } from '../../../api/http';
import '../../../styles/student-feedbacks.css';

function getStudentFeedbacks(session) {
  return authorizedRequest('/api/student/feedbacks', session);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

const SOURCE_LABEL = {
  Counselor: 'Cố vấn học tập',
  IndustryMentor: 'Industry Mentor',
};

const SOURCE_ICON = {
  Counselor: '🎓',
  IndustryMentor: '💼',
};

export function StudentFeedbacksPage({ session }) {
  const [data, setData] = useState({ items: [], counselorCount: 0, mentorCount: 0 });
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await getStudentFeedbacks(session);
        if (!cancelled) {
          setData({
            items: Array.isArray(result?.items) ? result.items : [],
            counselorCount: result?.counselorCount || 0,
            mentorCount: result?.mentorCount || 0,
          });
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message || 'Không tải được feedback.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const filtered = data.items.filter((item) => filter === 'All' || item.source === filter);

  return (
    <section className="student-feedbacks">
      <header className="student-feedbacks-hero">
        <span className="student-eyebrow">Feedback</span>
        <h1>Nhận xét từ cố vấn & mentor</h1>
        <p>
          Tổng hợp toàn bộ feedback bạn nhận được từ Academic Counselor và Industry
          Mentor. Sử dụng những gợi ý này để cải thiện lộ trình học tập.
        </p>
      </header>

      <div className="student-feedbacks-filters">
        <button
          type="button"
          className={filter === 'All' ? 'active' : ''}
          onClick={() => setFilter('All')}
        >
          Tất cả <span>{data.items.length}</span>
        </button>
        <button
          type="button"
          className={filter === 'Counselor' ? 'active' : ''}
          onClick={() => setFilter('Counselor')}
        >
          🎓 Cố vấn <span>{data.counselorCount}</span>
        </button>
        <button
          type="button"
          className={filter === 'IndustryMentor' ? 'active' : ''}
          onClick={() => setFilter('IndustryMentor')}
        >
          💼 Mentor <span>{data.mentorCount}</span>
        </button>
      </div>

      {loading ? (
        <div className="student-feedbacks-empty">⏳ Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="student-feedbacks-empty">
          <span>📭</span>
          <p>Chưa có feedback nào trong danh mục này.</p>
        </div>
      ) : (
        <div className="student-feedbacks-list">
          {filtered.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedbackCard({ item }) {
  return (
    <article className={`student-feedback-card source-${item.source.toLowerCase()}`}>
      <header className="student-feedback-head">
        <div className="student-feedback-author">
          {item.authorAvatarUrl ? (
            <img src={item.authorAvatarUrl} alt={item.authorFullName} />
          ) : (
            <span className="student-feedback-avatar">{getInitials(item.authorFullName)}</span>
          )}
          <div>
            <strong>{item.authorFullName}</strong>
            <small>
              {SOURCE_ICON[item.source]} {SOURCE_LABEL[item.source] || item.source}
            </small>
          </div>
        </div>

        <div className="student-feedback-meta">
          {item.rating != null && (
            <div className="student-feedback-rating" title={`${item.rating}/5`}>
              {'★'.repeat(item.rating)}
              <span>{'★'.repeat(5 - item.rating)}</span>
            </div>
          )}
          <small>{formatDate(item.createdAt)}</small>
        </div>
      </header>

      <p className="student-feedback-body">{item.comment}</p>

      {item.recommendations && (
        <section className="student-feedback-section">
          <strong>💡 Khuyến nghị</strong>
          <p>{item.recommendations}</p>
        </section>
      )}

      {item.technicalSkillsAssessment && (
        <section className="student-feedback-section">
          <strong>🛠 Đánh giá kỹ năng kỹ thuật</strong>
          <p>{item.technicalSkillsAssessment}</p>
        </section>
      )}

      {item.portfolioQualityFeedback && (
        <section className="student-feedback-section">
          <strong>📁 Nhận xét về portfolio</strong>
          <p>{item.portfolioQualityFeedback}</p>
        </section>
      )}

      {item.jobReadinessLevel && (
        <div className="student-feedback-readiness">
          <small>Mức độ sẵn sàng:</small>
          <strong>{item.jobReadinessLevel}</strong>
        </div>
      )}
    </article>
  );
}
