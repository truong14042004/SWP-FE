import { useEffect, useState } from 'react';
import { Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { getStudentRoadmapApprovalRequests } from '../mentorApi';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_META = {
  Pending: {
    label: 'Đang chờ cố vấn duyệt',
    className: 'pending',
    Icon: Clock3,
  },
  Approved: {
    label: 'Đã được duyệt',
    className: 'approved',
    Icon: CheckCircle2,
  },
  Rejected: {
    label: 'Bị từ chối',
    className: 'rejected',
    Icon: XCircle,
  },
};

/**
 * Hiển thị trạng thái các yêu cầu duyệt khung lộ trình (Luồng 2).
 * Chỉ hiện các yêu cầu còn ý nghĩa với sinh viên: Pending & Rejected.
 * (Approved đã trở thành roadmap trong danh sách bên dưới.)
 */
export function RoadmapApprovalStatus({ session }) {
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getStudentRoadmapApprovalRequests(session);
        if (!cancelled) setRequests(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!loaded) return null;

  const visible = requests.filter((r) => r.status === 'Pending' || r.status === 'Rejected');
  if (visible.length === 0) return null;

  return (
    <section className="roadmap-approval-panel">
      <header className="roadmap-approval-panel-head">
        <h3>Yêu cầu duyệt lộ trình</h3>
        <span>{visible.length} yêu cầu</span>
      </header>
      <div className="roadmap-approval-list">
        {visible.map((req) => {
          const meta = STATUS_META[req.status] || STATUS_META.Pending;
          const Icon = meta.Icon;
          return (
            <article key={req.id} className={`roadmap-approval-item ${meta.className}`}>
              <div className="roadmap-approval-icon" aria-hidden>
                <Icon size={18} />
              </div>
              <div className="roadmap-approval-body">
                <strong>{req.proposedTitle || 'Lộ trình đề xuất'}</strong>
                <span className="roadmap-approval-status-label">{meta.label}</span>
                {req.status === 'Rejected' && req.rejectionReason && (
                  <p className="roadmap-approval-reason">Lý do: {req.rejectionReason}</p>
                )}
                <small>Gửi lúc {formatDate(req.createdAt)}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
