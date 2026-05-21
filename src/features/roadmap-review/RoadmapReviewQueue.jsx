import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  approveReviewRequest,
  getCounselorRoadmapQueue,
  getEvidenceDownloadUrl,
  getMentorRoadmapQueue,
  rejectReviewRequest,
} from './reviewApi';
import '../../styles/review-queue.css';
import { Highlight } from '@/components/animate-ui/primitives/effects/highlight';
import { Fades } from '@/components/animate-ui/primitives/effects/fade';
import { motion } from 'motion/react';

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

const GRADIENTS = [
  { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#d63384' },
  { bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', text: '#0066cc' },
  { bg: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', text: '#198754' },
  { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', text: '#fd7e14' },
  { bg: 'linear-gradient(135deg, #abecd6 0%, #fbed96 100%)', text: '#0f5132' },
  { bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', text: '#0aa2c0' },
  { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#6f42c1' },
  { bg: 'linear-gradient(135deg, #fddb92 0%, #d1f6f1 100%)', text: '#5c636a' },
];

function getStudentGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function RoadmapReviewQueue({ session, role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

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

  async function handleDownloadEvidence(item) {
    setDownloadingId(item.id);
    try {
      const result = await getEvidenceDownloadUrl(session, item.id);
      if (result?.downloadUrl) {
        // Open in a new tab — browser handles download or preview
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.warn('Không lấy được link evidence.');
      }
    } catch (error) {
      toast.error(error.message || 'Không tải được evidence.');
    } finally {
      setDownloadingId('');
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
      <motion.header
        className="review-queue-head"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
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
      </motion.header>

      <div className="review-queue-filters">
        <Highlight
          value={filter}
          onValueChange={(val) => {
            if (val) setFilter(val);
          }}
          className="absolute inset-0 bg-[rgba(0,102,204,0.08)] rounded-full -z-10"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          hover={false}
          click={true}
        >
          {['Pending', 'Approved', 'Rejected', 'All'].map((option) => {
            const isActive = filter === option;
            return (
              <button
                key={option}
                type="button"
                data-value={option}
                className={`relative z-10 ${isActive ? 'active' : ''}`}
                style={{
                  background: 'transparent',
                  color: isActive ? 'var(--student-primary, #0066cc)' : '#6e6e73',
                  borderColor: isActive ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {option === 'All' ? 'Tất cả' : statusLabel(option)}
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(0, 102, 204, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                    color: isActive ? 'var(--student-primary, #0066cc)' : 'inherit',
                  }}
                >
                  {counts[option]}
                </span>
              </button>
            );
          })}
        </Highlight>
      </div>

      {loading ? (
        <div className="review-queue-empty">
          <div className="review-queue-empty-illustration" style={{ background: 'rgba(0, 102, 204, 0.05)' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-custom" style={{ color: 'var(--student-primary, #0066cc)' }}>
              <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
          </div>
          <h3>Đang tải danh sách</h3>
          <p>Hệ thống đang truy xuất dữ liệu từ máy chủ...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="review-queue-empty">
          <div className="review-queue-empty-illustration">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <h3>Hộp thư trống</h3>
          <p>Hiện tại không có yêu cầu review nào từ sinh viên trong danh mục này.</p>
        </div>
      ) : (
        <div className="review-queue-list">
          <Fades holdDelay={40} inView={true}>
            {filteredItems.map((item) => (
              <motion.article
                key={item.id}
                className={`review-queue-item status-${item.status.toLowerCase()}`}
                whileHover={{
                  y: -4,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                  borderColor:
                    item.status === 'Pending'
                      ? 'rgba(255, 149, 0, 0.6)'
                      : 'rgba(0, 0, 0, 0.12)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="review-queue-item-head">
                  <div className="review-queue-student">
                    <div
                      className="review-queue-avatar"
                      style={
                        !item.student.avatarUrl
                          ? {
                              background: getStudentGradient(item.student.fullName || '').bg,
                              color: getStudentGradient(item.student.fullName || '').text,
                              border: `1px solid ${getStudentGradient(item.student.fullName || '').text}25`,
                            }
                          : {}
                      }
                    >
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
                      <div className="review-queue-evidence-file">
                        <div>
                          <strong>📎 {item.evidenceFileName || 'File evidence'}</strong>
                          <small> · {item.evidenceType}</small>
                        </div>
                        <button
                          type="button"
                          className="review-queue-btn outline small"
                          onClick={() => handleDownloadEvidence(item)}
                          disabled={downloadingId === item.id}
                        >
                          {downloadingId === item.id ? 'Đang tạo link...' : '⬇ Tải xuống'}
                        </button>
                      </div>
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
              </motion.article>
            ))}
          </Fades>
        </div>
      )}
    </section>
  );
}
