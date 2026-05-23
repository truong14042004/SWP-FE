import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createReviewRequest,
  getAvailableReviewers,
  uploadRoadmapEvidence,
} from '../../roadmap-review/reviewApi';
import '../../../styles/review-modal.css';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILE_LABEL = '25MB';
const ALLOWED_EXTENSIONS = ['.zip', '.pdf', '.png', '.jpg', '.jpeg'];

function isValidGitUrl(value) {
  if (!value) return false;
  return /^https?:\/\/(www\.)?(github|gitlab|bitbucket)\.com\//i.test(value.trim());
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(1)} ${units[index]}`;
}

export function NodeReviewRequestModal({ session, node, onClose, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [reviewers, setReviewers] = useState({ counselor: null, industryMentors: [] });
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [selectedReviewer, setSelectedReviewer] = useState(null);

  const [evidenceMode, setEvidenceMode] = useState('git'); // 'git' | 'file'
  const [gitUrl, setGitUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedEvidence, setUploadedEvidence] = useState(null);

  const [studentNote, setStudentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getAvailableReviewers(session, node.id);
        if (!cancelled) setReviewers(result || { counselor: null, industryMentors: [] });
      } catch (error) {
        toast.error(error.message || 'Không tải được danh sách người review.');
      } finally {
        if (!cancelled) setLoadingReviewers(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session, node.id]);

  function handleSelectReviewer(reviewer) {
    if (!reviewer.available) {
      toast.warn('Bạn đã có yêu cầu pending với người này cho module này.');
      return;
    }
    setSelectedReviewer(reviewer);
    setStep(2);
  }

  async function handleFileChange(event) {
    const picked = event.target.files?.[0];
    if (!picked) return;

    const ext = picked.name.toLowerCase().slice(picked.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Chỉ cho phép ${ALLOWED_EXTENSIONS.join(', ')}`);
      event.target.value = '';
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      toast.error(`File vượt quá ${MAX_FILE_LABEL}.`);
      event.target.value = '';
      return;
    }

    setFile(picked);
    setUploadedEvidence(null);

    // Auto-upload immediately so the student doesn't have to click another button.
    setUploading(true);
    try {
      const result = await uploadRoadmapEvidence(session, picked);
      setUploadedEvidence(result);
      toast.success('Đã upload file evidence.');
    } catch (error) {
      toast.error(error.message || 'Upload thất bại.');
      setFile(null);
      event.target.value = '';
    } finally {
      setUploading(false);
    }
  }

  function evidencePayload() {
    if (evidenceMode === 'git') {
      const trimmed = gitUrl.trim();
      if (!trimmed) return null;
      return {
        evidenceUrl: trimmed,
        evidenceType: 'GitRepository',
        evidenceFileName: null,
      };
    }
    if (uploadedEvidence) {
      return {
        evidenceUrl: uploadedEvidence.objectName,
        evidenceType: uploadedEvidence.evidenceType,
        evidenceFileName: uploadedEvidence.fileName,
      };
    }
    return null;
  }

  function evidenceReady() {
    if (evidenceMode === 'git') return isValidGitUrl(gitUrl);
    return Boolean(uploadedEvidence);
  }

  async function handleSubmit() {
    const evidence = evidencePayload();
    if (!selectedReviewer || !evidence) {
      toast.warn('Hãy chọn reviewer và đính kèm evidence.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReviewRequest(session, node.id, {
        reviewerId: selectedReviewer.userId,
        studentNote: studentNote.trim() || null,
        ...evidence,
      });

      toast.success(`Đã gửi yêu cầu cho ${selectedReviewer.fullName}`);
      onSubmitted?.(result);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Không gửi được yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal" onClick={(event) => event.stopPropagation()}>
        <header className="review-modal-head">
          <div>
            <span className="review-eyebrow">Yêu cầu mentor review</span>
            <h2>{node.title}</h2>
          </div>
          <button type="button" className="review-modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <ol className="review-modal-steps">
          <li className={step >= 1 ? 'active' : ''}>1. Chọn reviewer</li>
          <li className={step >= 2 ? 'active' : ''}>2. Evidence</li>
          <li className={step >= 3 ? 'active' : ''}>3. Xác nhận</li>
        </ol>

        {step === 1 && (
          <ReviewerStep
            loading={loadingReviewers}
            counselor={reviewers.counselor}
            mentors={reviewers.industryMentors}
            onSelect={handleSelectReviewer}
          />
        )}

        {step === 2 && (
          <EvidenceStep
            mode={evidenceMode}
            onModeChange={setEvidenceMode}
            gitUrl={gitUrl}
            onGitUrlChange={setGitUrl}
            file={file}
            onFileChange={handleFileChange}
            uploading={uploading}
            uploadedEvidence={uploadedEvidence}
            studentNote={studentNote}
            onNoteChange={setStudentNote}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            evidenceReady={evidenceReady()}
          />
        )}

        {step === 3 && (
          <ConfirmStep
            reviewer={selectedReviewer}
            evidenceMode={evidenceMode}
            gitUrl={gitUrl}
            uploadedEvidence={uploadedEvidence}
            studentNote={studentNote}
            submitting={submitting}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

function ReviewerStep({ loading, counselor, mentors, onSelect }) {
  if (loading) {
    return <div className="review-modal-empty">⏳ Đang tải danh sách...</div>;
  }

  const hasReviewers = Boolean(counselor) || mentors.length > 0;
  if (!hasReviewers) {
    return (
      <div className="review-modal-empty">
        <span>📭</span>
        <p>Chưa có reviewer khả dụng. Có thể tất cả mentor đã hết quota — hãy liên hệ admin.</p>
      </div>
    );
  }

  return (
    <div className="review-modal-body">
      {counselor && (
        <section className="review-reviewer-section">
          <h3>Counselor được phân công</h3>
          <ReviewerCard reviewer={counselor} onSelect={onSelect} highlightAssigned />
        </section>
      )}

      {mentors.length > 0 && (
        <section className="review-reviewer-section">
          <h3>Industry Mentors</h3>
          <div className="review-reviewer-grid">
            {mentors.map((mentor) => (
              <ReviewerCard key={mentor.userId} reviewer={mentor} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewerCard({ reviewer, onSelect, highlightAssigned }) {
  return (
    <button
      type="button"
      className={`review-reviewer-card ${reviewer.available ? '' : 'disabled'}`}
      onClick={() => onSelect(reviewer)}
      disabled={!reviewer.available}
    >
      <div className="review-reviewer-avatar">
        {reviewer.avatarUrl ? (
          <img src={reviewer.avatarUrl} alt={reviewer.fullName} />
        ) : (
          <span>{(reviewer.fullName || '?').slice(0, 1).toUpperCase()}</span>
        )}
      </div>

      <div className="review-reviewer-info">
        <strong>{reviewer.fullName}</strong>
        <small>{reviewer.email}</small>
        {highlightAssigned && <span className="review-tag assigned">Counselor của bạn</span>}
        {reviewer.role === 'IndustryMentor' && reviewer.remaining !== null && (
          <span className="review-tag quota">
            Còn {reviewer.remaining}/{reviewer.quota} lượt
          </span>
        )}
        {!reviewer.available && (
          <span className="review-tag pending">Đang có yêu cầu pending</span>
        )}
      </div>
    </button>
  );
}

function EvidenceStep({
  mode,
  onModeChange,
  gitUrl,
  onGitUrlChange,
  file,
  onFileChange,
  uploading,
  uploadedEvidence,
  studentNote,
  onNoteChange,
  onBack,
  onNext,
  evidenceReady,
}) {
  return (
    <div className="review-modal-body">
      <div className="review-evidence-tabs">
        <button
          type="button"
          className={mode === 'git' ? 'active' : ''}
          onClick={() => onModeChange('git')}
        >
          Git Repository
        </button>
        <button
          type="button"
          className={mode === 'file' ? 'active' : ''}
          onClick={() => onModeChange('file')}
        >
          Upload file
        </button>
      </div>

      {mode === 'git' && (
        <div className="review-evidence-content">
          <label className="review-field">
            <span>URL repository</span>
            <input
              type="url"
              placeholder="https://github.com/your-username/project-name"
              value={gitUrl}
              onChange={(event) => onGitUrlChange(event.target.value)}
            />
          </label>
          <p className="review-hint">
            Hỗ trợ GitHub, GitLab, Bitbucket. Repository nên public hoặc invite reviewer.
          </p>
        </div>
      )}

      {mode === 'file' && (
        <div className="review-evidence-content">
          <label className={`review-file-drop ${uploading ? 'uploading' : ''} ${uploadedEvidence ? 'uploaded' : ''}`}>
            <input
              type="file"
              accept=".zip,.pdf,.png,.jpg,.jpeg"
              onChange={onFileChange}
              disabled={uploading}
              hidden
            />
            <div>
              <strong>
                {uploading
                  ? '⏳ Đang upload...'
                  : uploadedEvidence
                  ? `✓ Đã upload: ${uploadedEvidence.fileName}`
                  : file
                  ? file.name
                  : 'Chọn file để upload'}
              </strong>
              <small>
                {uploadedEvidence
                  ? `${uploadedEvidence.evidenceType} · ${formatFileSize(uploadedEvidence.fileSize)}`
                  : file
                  ? formatFileSize(file.size)
                  : `ZIP / PDF / PNG / JPG, tối đa 25MB`}
              </small>
            </div>
          </label>
        </div>
      )}

      <label className="review-field">
        <span>Ghi chú cho reviewer (tùy chọn)</span>
        <textarea
          rows={4}
          value={studentNote}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Mô tả ngắn gọn dự án hoặc highlight phần bạn muốn được review."
        />
      </label>

      <div className="review-modal-actions">
        <button type="button" className="review-btn outline" onClick={onBack}>
          ← Quay lại
        </button>
        <button
          type="button"
          className="review-btn primary"
          onClick={onNext}
          disabled={!evidenceReady}
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({
  reviewer,
  evidenceMode,
  gitUrl,
  uploadedEvidence,
  studentNote,
  submitting,
  onBack,
  onSubmit,
}) {
  return (
    <div className="review-modal-body">
      <div className="review-confirm-grid">
        <article>
          <h4>Người review</h4>
          <p>
            <strong>{reviewer.fullName}</strong>
            <br />
            <small>
              {reviewer.role === 'AcademicCounselor' ? 'Academic Counselor' : 'Industry Mentor'}
            </small>
          </p>
        </article>

        <article>
          <h4>Evidence</h4>
          {evidenceMode === 'git' ? (
            <p>
              <strong>Git Repository</strong>
              <br />
              <a href={gitUrl} target="_blank" rel="noreferrer">
                {gitUrl}
              </a>
            </p>
          ) : uploadedEvidence ? (
            <p>
              <strong>{uploadedEvidence.fileName}</strong>
              <br />
              <small>
                {uploadedEvidence.evidenceType} · {formatFileSize(uploadedEvidence.fileSize)}
              </small>
            </p>
          ) : (
            <p>Chưa có evidence</p>
          )}
        </article>

        {studentNote && (
          <article className="review-confirm-note">
            <h4>Ghi chú</h4>
            <p>{studentNote}</p>
          </article>
        )}
      </div>

      <div className="review-modal-actions">
        <button type="button" className="review-btn outline" onClick={onBack}>
          ← Quay lại
        </button>
        <button
          type="button"
          className="review-btn primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </div>
    </div>
  );
}
