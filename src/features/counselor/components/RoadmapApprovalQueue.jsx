import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { Folder, FileText } from 'lucide-react';
import { Button } from '@/components/animate-ui/components/buttons/button';
import {
  getRoadmapApprovalQueue,
  getRoadmapApprovalRequestDetails,
  approveRoadmapRequest,
  rejectRoadmapRequest,
} from '../api/counselorApi';

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'S'
  );
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countNodes(nodes = []) {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children || node.Children || []), 0);
}

export function RoadmapApprovalQueue({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getRoadmapApprovalQueue(session);
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) toast.error(error.message || 'Không thể tải hàng đợi duyệt lộ trình');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function openPreview(item) {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await getRoadmapApprovalRequestDetails(session, item.id);
      setDetail(data);
    } catch (error) {
      toast.error(error.message || 'Không thể tải chi tiết lộ trình');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closePreview() {
    setSelected(null);
    setDetail(null);
  }

  async function handleApprove() {
    if (!selected) return;
    try {
      await approveRoadmapRequest(session, selected.id);
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      toast.success('Đã duyệt và khởi tạo lộ trình cho sinh viên.');
      closePreview();
    } catch (error) {
      toast.error(error.message || 'Không thể duyệt lộ trình.');
    }
  }

  async function handleReject(reason) {
    if (!selected) return;
    try {
      await rejectRoadmapRequest(session, selected.id, reason);
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      toast.success('Đã từ chối đề xuất lộ trình.');
      closePreview();
    } catch (error) {
      toast.error(error.message || 'Không thể từ chối lộ trình.');
    }
  }

  if (loading) {
    return (
      <div className="counselor-loading">
        <div className="counselor-spinner" aria-hidden />
        <p>Đang tải hàng đợi...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="counselor-empty">
        <div className="counselor-empty-icon" aria-hidden>✓</div>
        <h4>Không có lộ trình chờ duyệt</h4>
        <p>Chưa có đề xuất lộ trình AI nào từ sinh viên của bạn.</p>
      </div>
    );
  }

  return (
    <section className="cv-queue">
      <p className="counselor-tab-meta">{items.length} đề xuất lộ trình đang chờ duyệt</p>
      <div className="cv-queue-list">
        {items.map((item) => (
          <motion.article
            key={item.id}
            className="cv-queue-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="cv-queue-card-head">
              <div className="counselor-avatar" aria-hidden>{getInitials(item.studentFullName)}</div>
              <div className="cv-queue-student">
                <strong>{item.studentFullName}</strong>
                <span>{item.studentEmail}</span>
              </div>
              <span className="cv-queue-time">{formatDate(item.createdAt)}</span>
            </div>
            <div className="cv-queue-card-actions">
              <Button
                type="button"
                className="counselor-btn counselor-btn-primary"
                onClick={() => openPreview(item)}
                hoverScale={1.04}
                tapScale={0.96}
              >
                Xem & duyệt
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <RoadmapPreviewModal
            student={selected}
            detail={detail}
            loading={detailLoading}
            onClose={closePreview}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function RoadmapPreviewModal({ student, detail, loading, onClose, onApprove, onReject }) {
  const [mode, setMode] = useState('view'); // 'view' | 'reject'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const payload = detail?.payload || detail?.Payload;
  const nodes = payload?.nodes || payload?.Nodes || [];
  const nodeCount = countNodes(nodes);

  async function doApprove() {
    setBusy(true);
    try {
      await onApprove();
    } finally {
      setBusy(false);
    }
  }

  async function doReject() {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    setBusy(true);
    try {
      await onReject(reason.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="cv-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="cv-modal cv-modal--wide"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cv-modal-head">
          <div>
            <span className="counselor-eyebrow">Đề xuất lộ trình · {student.studentFullName}</span>
            <h3>{payload?.title || payload?.Title || 'Lộ trình đề xuất'}</h3>
          </div>
        </header>

        {loading && (
          <div className="counselor-loading">
            <div className="counselor-spinner" aria-hidden />
            <p>Đang tải khung lộ trình...</p>
          </div>
        )}

        {!loading && payload && (
          <>
            {(payload.description || payload.Description) && (
              <p className="cv-modal-sub">{payload.description || payload.Description}</p>
            )}
            <div className="cv-queue-meta" style={{ marginBottom: 12 }}>
              <span className="cv-queue-evidence-type">{nodeCount} module</span>
              {(payload.careerRoleHint || payload.CareerRoleHint) && (
                <span className="cv-queue-evidence-type">
                  {payload.careerRoleHint || payload.CareerRoleHint}
                </span>
              )}
              {(payload.totalEstimatedHours || payload.TotalEstimatedHours) && (
                <span className="cv-queue-evidence-type">
                  {payload.totalEstimatedHours || payload.TotalEstimatedHours} giờ
                </span>
              )}
            </div>

            <div className="cv-modal-tree">
              {nodes.map((node, idx) => (
                <PreviewNode key={idx} node={node} level={0} />
              ))}
            </div>

            {mode === 'reject' && (
              <label className="cv-modal-field" style={{ marginTop: 16 }}>
                <span>Lý do từ chối (bắt buộc)</span>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Lộ trình chưa bám sát yêu cầu nghề mục tiêu..."
                />
              </label>
            )}
          </>
        )}

        <div className="cv-modal-actions">
          {mode === 'view' ? (
            <>
              <Button
                type="button"
                className="counselor-btn counselor-btn-link"
                onClick={onClose}
                disabled={busy}
              >
                Đóng
              </Button>
              <Button
                type="button"
                className="counselor-btn counselor-btn-danger"
                onClick={() => setMode('reject')}
                disabled={busy || loading}
              >
                Từ chối
              </Button>
              <Button
                type="button"
                className="counselor-btn counselor-btn-primary"
                onClick={doApprove}
                disabled={busy || loading || !payload}
              >
                {busy ? 'Đang duyệt...' : 'Duyệt & khởi tạo'}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                className="counselor-btn counselor-btn-link"
                onClick={() => setMode('view')}
                disabled={busy}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                className="counselor-btn counselor-btn-danger"
                onClick={doReject}
                disabled={busy}
              >
                {busy ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PreviewNode({ node, level }) {
  const title = node.title || node.Title;
  const description = node.description || node.Description;
  const nodeType = node.nodeType || node.NodeType;
  const estimatedHours = node.estimatedHours || node.EstimatedHours;
  const children = node.children || node.Children || [];
  const isGroup = nodeType === 'Group' || children.length > 0;

  return (
    <div className="cv-modal-tree-node" style={{ '--depth': level }}>
      <div className="cv-modal-tree-row">
        <strong>
          {isGroup ? <Folder size={14} aria-hidden /> : <FileText size={14} aria-hidden />} {title}
        </strong>
        {estimatedHours ? <small>{estimatedHours}h</small> : null}
      </div>
      {description && <p>{description}</p>}
      {children.map((child, idx) => (
        <PreviewNode key={idx} node={child} level={level + 1} />
      ))}
    </div>
  );
}
