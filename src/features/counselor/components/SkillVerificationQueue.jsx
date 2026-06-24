import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-toastify';
import { Button } from '@/components/animate-ui/components/buttons/button';
import {
  getSkillVerificationQueue,
  verifyStudentSkill,
  rejectStudentSkillEvidence,
  getSignedUrl,
} from '../api/counselorApi';

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Verified'];

const LEVEL_LABELS = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
  Verified: 'Đã xác minh',
};

function levelLabel(level) {
  return LEVEL_LABELS[level] || level || '—';
}

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

export function SkillVerificationQueue({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getSkillVerificationQueue(session);
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) toast.error(error.message || 'Không thể tải hàng đợi duyệt kỹ năng');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleViewEvidence(objectName) {
    if (!objectName) return;
    // External links (GitHub/CV) are stored as full URLs; storage objects need a signed URL.
    if (/^https?:\/\//i.test(objectName)) {
      window.open(objectName, '_blank', 'noopener');
      return;
    }
    try {
      const response = await getSignedUrl(session, objectName);
      if (response.url) window.open(response.url, '_blank', 'noopener');
    } catch (error) {
      toast.error('Không thể mở minh chứng.');
    }
  }

  async function handleConfirmVerify(verifiedLevel) {
    if (!verifyTarget) return;
    try {
      await verifyStudentSkill(session, verifyTarget.userSkillId, { verifiedLevel });
      setItems((prev) => prev.filter((i) => i.userSkillId !== verifyTarget.userSkillId));
      toast.success(`Đã xác nhận kỹ năng ${verifyTarget.skillName} ở mức ${verifiedLevel}.`);
      setVerifyTarget(null);
    } catch (error) {
      toast.error(error.message || 'Không thể xác nhận kỹ năng.');
    }
  }

  async function handleConfirmReject(reason) {
    if (!rejectTarget) return;
    try {
      await rejectStudentSkillEvidence(session, rejectTarget.userSkillId, reason);
      setItems((prev) => prev.filter((i) => i.userSkillId !== rejectTarget.userSkillId));
      toast.success(`Đã từ chối minh chứng kỹ năng ${rejectTarget.skillName}.`);
      setRejectTarget(null);
    } catch (error) {
      toast.error(error.message || 'Không thể từ chối minh chứng.');
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
        <h4>Không có kỹ năng chờ duyệt</h4>
        <p>Tất cả minh chứng kỹ năng của sinh viên đã được xử lý.</p>
      </div>
    );
  }

  return (
    <section className="cv-queue">
      <p className="counselor-tab-meta">{items.length} kỹ năng đang chờ xác thực</p>
      <div className="cv-queue-list">
        {items.map((item) => (
          <motion.article
            key={item.userSkillId}
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
              <span className="cv-queue-time">{formatDate(item.submittedAt)}</span>
            </div>

            <div className="cv-queue-card-body">
              <div className="cv-queue-skill">
                <span className="cv-queue-skill-name">{item.skillName}</span>
                <span className="cv-queue-skill-cat">{item.skillCategory}</span>
              </div>
              <div className="cv-queue-meta">
                <span className="counselor-skill-level">{levelLabel(item.level)}</span>
                {item.evidenceType && (
                  <span className="cv-queue-evidence-type">{item.evidenceType}</span>
                )}
              </div>
            </div>

            <div className="cv-queue-card-actions">
              <Button
                type="button"
                className="counselor-btn counselor-btn-link"
                onClick={() => handleViewEvidence(item.evidenceUrl)}
                disabled={!item.evidenceUrl}
                hoverScale={1.04}
                tapScale={0.96}
              >
                Xem minh chứng
              </Button>
              <Button
                type="button"
                className="counselor-btn counselor-btn-danger"
                onClick={() => setRejectTarget(item)}
                hoverScale={1.04}
                tapScale={0.96}
              >
                Từ chối
              </Button>
              <Button
                type="button"
                className="counselor-btn counselor-btn-primary"
                onClick={() => setVerifyTarget(item)}
                hoverScale={1.04}
                tapScale={0.96}
              >
                Xác nhận đạt
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {verifyTarget && (
          <VerifyLevelModal
            skillName={verifyTarget.skillName}
            currentLevel={verifyTarget.level}
            onCancel={() => setVerifyTarget(null)}
            onConfirm={handleConfirmVerify}
          />
        )}
        {rejectTarget && (
          <RejectReasonModal
            skillName={rejectTarget.skillName}
            onCancel={() => setRejectTarget(null)}
            onConfirm={handleConfirmReject}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export function VerifyLevelModal({ skillName, currentLevel, onCancel, onConfirm }) {
  const [level, setLevel] = useState(
    LEVEL_OPTIONS.includes(currentLevel) ? currentLevel : 'Intermediate',
  );
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onConfirm(level);
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
      onClick={onCancel}
    >
      <motion.div
        className="cv-modal"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Xác nhận kỹ năng</h3>
        <p className="cv-modal-sub">
          Chọn mức độ đã xác thực cho kỹ năng <strong>{skillName}</strong>.
        </p>
        <label className="cv-modal-field">
          <span>Mức độ xác thực</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{levelLabel(opt)}</option>
            ))}
          </select>
        </label>
        <div className="cv-modal-actions">
          <Button
            type="button"
            className="counselor-btn counselor-btn-link"
            onClick={onCancel}
            disabled={busy}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="counselor-btn counselor-btn-primary"
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Đang lưu...' : 'Xác nhận đạt'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RejectReasonModal({ skillName, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
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
      onClick={onCancel}
    >
      <motion.div
        className="cv-modal"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Từ chối minh chứng</h3>
        <p className="cv-modal-sub">
          Nhập lý do từ chối cho kỹ năng <strong>{skillName}</strong>. Kỹ năng sẽ
          chuyển về trạng thái chưa xác thực và sinh viên có thể nộp lại minh chứng.
        </p>
        <label className="cv-modal-field">
          <span>Lý do (tùy chọn)</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Minh chứng chưa rõ ràng, cần bổ sung repo/chứng chỉ..."
          />
        </label>
        <div className="cv-modal-actions">
          <Button
            type="button"
            className="counselor-btn counselor-btn-link"
            onClick={onCancel}
            disabled={busy}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="counselor-btn counselor-btn-danger"
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Đang gửi...' : 'Xác nhận từ chối'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
