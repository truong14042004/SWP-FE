import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  approveReviewRequest,
  getCounselorRoadmapQueue,
  getMentorRoadmapQueue,
  rejectReviewRequest,
} from './reviewApi';
import '../../styles/review-queue.css';

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusLabel(status) {
  switch (status) {
    case 'Pending': return 'Đang chờ';
    case 'Approved': return 'Đã duyệt';
    case 'Rejected': return 'Đã từ chối';
    case 'Cancelled': return 'Đã hủy';
    default: return status;
  }
}

export function RoadmapReviewQueue({ session, role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const fetcher = role === 'IndustryMentor'
        ? getMentorRoadmapQueue
        : getCounselorRoadmapQueue;
      const result = await fetcher(session);
      setItems(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(error.message || 'Không tải được queue.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(item) {
    if (!confirm(`Duyệt module "${item.node.title}" của ${item.student.fullName}?`)) return;

    setActionLoadingId(item.id);
    try {
      await approveReviewRequest(session, item.id, { reviewerNote: null });
      toast.success('Đã duyệt thành công.');
      await loadQueue();
    } catch (error) {
      toast.error(error.message || 'Không duyệt được.');
    } finally {
      setActionLoadingId('');
    }
  }

  function startReject(itemId) {
    setRejectingId(itemId);
    setRejectNote('');
  }

  async function handleReject(item) {
    const note = rejectNote.trim();
    if (!note) {
      toast.warn('Vui lòng nhập lý do từ chối.');
      return;
    }

    setActionLoadingId(item.id);
    try {
      await rejectReviewRequest(session, item.id, { reviewerNote: note });
      toast.success('Đã từ chối yêu cầu.');
      setRejectingId('');
      setRejectNote('');
      await loadQueue();
    } catch (error) {
      toast.error(error.message || 'Không từ chối được.');
    } finally {
      setActionLoadingId('');
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const counts = {
    Pending: items.filter((item) => item.status === 'Pending').length,
    Approved: items.filter((item) => item.status === 'Approved').length,
    Rejected: items.filter((item) => item.status === 'Rejected').length,
    All: items.length,
  };

  return (
    <section className="review-queue-page">
      <header className="review-queue-head">
        <div>
          <span className="review-queue-eyebrow">Roadmap reviews</span>
          <h1>Yêu cầu review từ sinh viên</h1>
          <p>Duyệt yêu cầu xác minh module trong roadmap của sinh viên.</p>
        </div>

        <button
          type="button"
          className="review-queue-refresh"
          onClick={loadQueue}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : '↻ Tải lại'}
        </button>
      </header>

      <div className="review-queue-filters">
        {['Pending', 'Approved', 'Rejected', 'All'].map((option) => (
          <button
            key={option}
            type="button"
            className={filter === option ? 'active' : ''}
            onClick={() => setFilter(option)}
          >
            {option === 'All' ? 'Tất cả' : statusLabel(option)}
            <span>{counts[option]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="review-queue-empty">⏳ Đang tải danh sách...</div>
      ) : filteredItems.length === 0 ? (
        <div className="review-queue-empty">
          <span>📭</span>
          <p>Không có yêu cầu nào.</p>
        </div>
      ) : (
        <div className="review-queue-list">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`review-queue-item status-${item.status.toLowerCase()}`}
            >
              <div className="review-queue-item-head">
                <div className="review-queue-student">
                  <div className="review-queue-avatar">
                    {item.student.avatarUrl ? (
                      <img src={item.student.avatarUrl} alt={item.student.fullName} />
                    ) : (
                      <span>{(item.student.fullName || '?').slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <strong>{item.student.fullName}</strong>
                    <small>{item.student.email}</small>
                  </div>
                </div>

                <span className={`review-queue-badge ${item.status.toLowerCase()}`}>
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="review-queue-node">
                <small>{item.node.careerRoleName} · {item.node.roadmapTitle}</small>
                <h3>{item.node.title}</h3>
                {item.node.description && <p>{item.node.description}</p>}
              </div>

              <div className="review-queue-meta">
                <span>Gửi: {formatDateTime(item.requestedAt)}</span>
                {item.respondedAt && <span>Phản hồi: {formatDateTime(item.respondedAt)}</span>}
              </div>

              {item.studentNote && (
                <div className="review-queue-note student">
                  <small>Ghi chú từ sinh viên</small>
                  <p>{item.studentNote}</p>
                </div>
              )}

              {item.evidenceUrl && (
                <div className="review-queue-evidence">
                  <small>Evidence</small>
                  {item.evidenceType === 'GitRepository' ? (
                    <a href={item.evidenceUrl} target="_blank" rel="noreferrer">
                      🔗 {item.evidenceUrl}
                    </a>
                  ) : (
                    <span>
                      📎 {item.evidenceFileName || 'File evidence'}
                      <small> ({item.evidenceType})</small>
                      <br />
                      <code>{item.evidenceUrl}</code>
                    </span>
                  )}
                </div>
              )}

              {item.reviewerNote && (
                <div className="review-queue-note reviewer">
                  <small>Ghi chú của bạn</small>
                  <p>{item.reviewerNote}</p>
                </div>
              )}

              {item.status === 'Pending' && (
                <div className="review-queue-actions">
                  {rejectingId === item.id ? (
                    <div className="review-queue-reject-form">
                      <textarea
                        rows={3}
                        placeholder="Nhập lý do từ chối..."
                        value={rejectNote}
                        onChange={(event) => setRejectNote(event.target.value)}
                      />
                      <div>
                        <button
                          type="button"
                          className="review-queue-btn outline"
                          onClick={() => {
                            setRejectingId('');
                            setRejectNote('');
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="review-queue-btn danger"
                          onClick={() => handleReject(item)}
                          disabled={actionLoadingId === item.id}
                        >
                          {actionLoadingId === item.id ? 'Đang gửi...' : 'Xác nhận từ chối'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="review-queue-btn outline"
                        onClick={() => startReject(item.id)}
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        className="review-queue-btn primary"
                        onClick={() => handleApprove(item)}
                        disabled={actionLoadingId === item.id}
                      >
                        {actionLoadingId === item.id ? 'Đang duyệt...' : '✓ Duyệt verify'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
