import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart3, Diamond, LoaderCircle, Pin, Search } from 'lucide-react';
import { apiUrl } from '../../../config';
import '../../../styles/skills.css';
import {
  analyzeSkillGap,
  createUserSkill,
  deleteUserSkill,
  getLatestSkillGap,
  getSignedUrl,
  getSkills,
  getUserSkills,
  importUserSkillEvidenceFromUrl,
  updateUserSkill,
  uploadUserSkillEvidence,
} from '../skillsApi';
import { getStudentProfile } from '../studentApi';
const EMPTY_FORM = {
  skillId: '',
  level: 'Beginner',
  evidenceUrl: '',
  evidenceType: 'Project',
};

const LEVELS = [
  { value: 'Beginner', label: 'Beginner', score: 25 },
  { value: 'Intermediate', label: 'Intermediate', score: 50 },
  { value: 'Advanced', label: 'Advanced', score: 100 },
];

const EVIDENCE_TYPES = [
  'Project',
  'Certificate',
  'GitHub',
  'Portfolio',
  'Course',
  'Other',
];

// Mirror of the backend EvidenceContentTypes whitelist (StorageController.cs).
const ACCEPTED_EVIDENCE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-compressed',
]);
const ACCEPTED_EVIDENCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.zip'];
const EVIDENCE_FILE_HINT = 'Chỉ chấp nhận JPG, PNG, WEBP, PDF hoặc ZIP.';

function isAcceptedEvidenceFile(file) {
  if (!file) return false;
  if (ACCEPTED_EVIDENCE_MIMES.has(file.type)) return true;
  // Some browsers leave file.type empty for uncommon archives. Fall back to
  // the extension so the picker accept= and our guard agree.
  const name = (file.name || '').toLowerCase();
  return ACCEPTED_EVIDENCE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getLevelScore(level) {
  const found = LEVELS.find((item) => normalizeText(item.value) === normalizeText(level));
  return found?.score || 0;
}

function getLevelClass(level) {
  const score = getLevelScore(level);

  if (score >= 75) return 'strong';
  if (score >= 50) return 'medium';
  return 'weak';
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function resolveStorageUrl(value) {
  if (!value) return '';

  const normalized = String(value).trim();

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (!apiUrl) {
    return normalized;
  }

  if (normalized.startsWith('/api/storage/public/')) {
    return `${apiUrl}${normalized}`;
  }

  if (normalized.startsWith('api/storage/public/')) {
    return `${apiUrl}/${normalized}`;
  }

  return `${apiUrl}/api/storage/public/${normalized.replace(/^\/+/, '')}/download`;
}

function getSkillName(skill) {
  return skill?.name || skill?.skillName || 'Kỹ năng chưa đặt tên';
}

function getSkillCategory(skill) {
  return skill?.category || skill?.skillCategory || 'Khác';
}

function getSkillDescription(skill) {
  return skill?.description || 'Chưa có mô tả cho kỹ năng này.';
}

function mergeUserSkillWithCatalog(userSkill, skills) {
  const skill = skills.find((item) => item.id === userSkill.skillId);

  return {
    ...userSkill,
    skillName: userSkill.skillName || skill?.name || 'Kỹ năng chưa xác định',
    skillCategory: userSkill.skillCategory || skill?.category || 'Khác',
    skillDescription: skill?.description || '',
  };
}

export function StudentSkillsPage({ session }) {
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  // File picked while creating a new skill (no userSkillId yet). Uploaded
  // after the skill is persisted; cleared on cancel/reset.
  const [pendingEvidenceFile, setPendingEvidenceFile] = useState(null);

const [profile, setProfile] = useState(null);
const [skillGapReport, setSkillGapReport] = useState(null);
const [loadingSkillGap, setLoadingSkillGap] = useState(false);
const [analyzingSkillGap, setAnalyzingSkillGap] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  const enrichedUserSkills = useMemo(() => {
    return safeArray(userSkills).map((item) => mergeUserSkillWithCatalog(item, skills));
  }, [userSkills, skills]);

  const categories = useMemo(() => {
    const values = safeArray(skills)
      .filter((skill) => skill.isActive !== false)
      .map(getSkillCategory)
      .filter(Boolean);

    return ['all', ...Array.from(new Set(values))];
  }, [skills]);

  const addedSkillIds = useMemo(() => {
    return new Set(enrichedUserSkills.map((item) => item.skillId));
  }, [enrichedUserSkills]);

  const availableSkills = useMemo(() => {
    return safeArray(skills)
      .filter((skill) => skill.isActive !== false)
      .filter((skill) => !editingId || skill.id === form.skillId || !addedSkillIds.has(skill.id));
  }, [skills, addedSkillIds, editingId, form.skillId]);

  const filteredCatalogSkills = useMemo(() => {
    const keyword = normalizeText(query);

    return safeArray(skills)
      .filter((skill) => skill.isActive !== false)
      .filter((skill) => {
        const matchedCategory =
          activeCategory === 'all' || getSkillCategory(skill) === activeCategory;

        const matchedSearch =
          !keyword ||
          normalizeText(getSkillName(skill)).includes(keyword) ||
          normalizeText(getSkillCategory(skill)).includes(keyword) ||
          normalizeText(getSkillDescription(skill)).includes(keyword);

        return matchedCategory && matchedSearch;
      });
  }, [skills, query, activeCategory]);

  const filteredUserSkills = useMemo(() => {
    const keyword = normalizeText(query);

    return enrichedUserSkills.filter((item) => {
      const matchedCategory =
        activeCategory === 'all' || item.skillCategory === activeCategory;

      const matchedSearch =
        !keyword ||
        normalizeText(item.skillName).includes(keyword) ||
        normalizeText(item.skillCategory).includes(keyword) ||
        normalizeText(item.level).includes(keyword);

      return matchedCategory && matchedSearch;
    });
  }, [enrichedUserSkills, query, activeCategory]);

  const stats = useMemo(() => {
    const totalCatalog = safeArray(skills).filter((skill) => skill.isActive !== false).length;
    const totalUser = enrichedUserSkills.length;
    const verified = enrichedUserSkills.filter((item) => item.isVerified).length;

    const levelOrder = ['Beginner', 'Intermediate', 'Advanced', 'Verified'];
    let topLevel = '—';
    let topRank = -1;
    enrichedUserSkills.forEach((item) => {
      const idx = levelOrder.indexOf(item.level);
      if (idx > topRank) {
        topRank = idx;
        topLevel = item.level;
      }
    });

    return {
      totalCatalog,
      totalUser,
      verified,
      topLevel,
      average: totalUser
        ? Math.round(enrichedUserSkills.reduce((sum, item) => sum + getLevelScore(item.level), 0) / totalUser)
        : 0,
    };
  }, [skills, enrichedUserSkills]);

async function loadData() {
  setLoading(true);
  setLoadingSkillGap(true);
  try {
    const [skillResult, userSkillResult, profileResult, latestGapResult] = await Promise.all([
      getSkills(session),
      getUserSkills(session),
      getStudentProfile(session).catch(() => null),
      getLatestSkillGap(session).catch(() => null),
    ]);

    setSkills(safeArray(skillResult));
    setUserSkills(safeArray(userSkillResult));
    setProfile(profileResult);
    setSkillGapReport(latestGapResult);
  } catch (requestError) {
    toast.error(requestError.message || 'Khong tai duoc du lieu ky nang.');
  } finally {
    setLoading(false);
    setLoadingSkillGap(false);
  }
}

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate(skillId = '') {
    setEditingId('');
    setForm({
      ...EMPTY_FORM,
      skillId,
    });
    setPendingEvidenceFile(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function startEdit(userSkill) {
    setEditingId(userSkill.id);
    setForm({
      skillId: userSkill.skillId || '',
      level: userSkill.level || 'Beginner',
      evidenceUrl: userSkill.evidenceUrl || '',
      evidenceType: userSkill.evidenceType || 'Project',
    });
    setPendingEvidenceFile(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    setEditingId('');
    setForm(EMPTY_FORM);
    setPendingEvidenceFile(null);
  }

  function getFileNameFromUrl(url) {
    return url.split('/').pop()?.split('?')[0] || 'evidence';
  }

  function getStorageValue(fileInfo, fallback = '') {
    return fileInfo?.downloadPath || fileInfo?.objectName || fallback;
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
  }

  async function handleEvidenceFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isAcceptedEvidenceFile(file)) {
      toast.error(`File “${file.name}” không được hỗ trợ. ${EVIDENCE_FILE_HINT}`);
      return;
    }

    // Creating a new skill: stash the file and show a placeholder in the URL
    // input so users see something happened. The real upload runs after save.
    if (!editingId) {
      setPendingEvidenceFile(file);
      setForm((current) => ({
        ...current,
        evidenceUrl: current.evidenceUrl || `Đang chờ upload: ${file.name}`,
      }));
      toast.info('File sẽ được tải lên sau khi bạn lưu kỹ năng.');
      return;
    }

    setUploadingEvidence(true);
    try {
      const uploaded = await uploadUserSkillEvidence(session, editingId, file);
      setForm((current) => ({
        ...current,
        evidenceUrl: getStorageValue(uploaded, current.evidenceUrl),
      }));
      toast.success('Da upload minh chung.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong upload duoc minh chung.');
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function handleEvidenceImport() {
    const url = form.evidenceUrl.trim();

    if (!editingId || !url) {
      return;
    }

    if (!isHttpUrl(url)) {
      toast.warn('URL import phai bat dau bang http:// hoac https://.');
      return;
    }

    setUploadingEvidence(true);
    try {
      const imported = await importUserSkillEvidenceFromUrl(session, editingId, {
        url,
        fileName: getFileNameFromUrl(url),
      });
      setForm((current) => ({
        ...current,
        evidenceUrl: getStorageValue(imported, url),
      }));
      toast.success('Da import minh chung tu URL.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong import duoc minh chung.');
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    try {
      // When the user staged a file before saving, treat the placeholder URL
      // as empty so it doesn't get sent to the backend.
      const stagedFile = pendingEvidenceFile;
      const cleanedEvidenceUrl =
        stagedFile && form.evidenceUrl.startsWith('Đang chờ upload: ')
          ? ''
          : form.evidenceUrl.trim();

      const payload = {
        skillId: form.skillId,
        level: form.level,
        evidenceUrl: cleanedEvidenceUrl,
        evidenceType: form.evidenceType,
      };

      if (editingId) {
        const updated = await updateUserSkill(session, editingId, {
          level: payload.level,
          evidenceUrl: payload.evidenceUrl,
          evidenceType: payload.evidenceType,
        });

        setUserSkills((current) =>
          current.map((item) => (item.id === editingId ? updated : item))
        );

        toast.success('Da cap nhat ky nang.');
      } else {
        const created = await createUserSkill(session, payload);

        // If the user picked a file before save, upload it now and stitch the
        // resulting evidence URL back into the freshly-created skill.
        let finalSkill = created;
        if (stagedFile && created?.id) {
          setUploadingEvidence(true);
          try {
            const uploaded = await uploadUserSkillEvidence(
              session,
              created.id,
              stagedFile,
            );
            const evidenceUrl = getStorageValue(uploaded, '');
            if (evidenceUrl) {
              finalSkill = {
                ...created,
                evidenceUrl,
                evidenceType: created.evidenceType || form.evidenceType,
              };
            }
            toast.success('Da upload minh chung cho ky nang moi.');
          } catch (uploadError) {
            toast.error(uploadError.message || 'Khong upload duoc minh chung sau khi luu.');
          } finally {
            setUploadingEvidence(false);
          }
        }

        setUserSkills((current) => [finalSkill, ...current]);
        toast.success('Da them ky nang vao ho so.');
      }

      setEditingId('');
      setForm(EMPTY_FORM);
      setPendingEvidenceFile(null);
    } catch (requestError) {
      toast.error(requestError.message || 'Khong luu duoc ky nang.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userSkill) {
    const confirmed = window.confirm(`Xóa kỹ năng "${userSkill.skillName}" khỏi hồ sơ?`);
    if (!confirmed) return;

    try {
      await deleteUserSkill(session, userSkill.id);
      setUserSkills((current) => current.filter((item) => item.id !== userSkill.id));
      toast.success('Da xoa ky nang khoi ho so.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong xoa duoc ky nang.');
    }
  }

  async function handleAnalyzeSkillGap() {
  const careerRoleId = profile?.targetRoleId;

  if (!careerRoleId) {
    toast.warn('Ban chua cap nhat vai tro muc tieu trong ho so.');
    return;
  }

  setAnalyzingSkillGap(true);
  try {
    const result = await analyzeSkillGap(session, careerRoleId);
    setSkillGapReport(result);
    toast.success('Da phan tich skill gap thanh cong.');
  } catch (requestError) {
    toast.error(requestError.message || 'Khong phan tich duoc skill gap.');
  } finally {
    setAnalyzingSkillGap(false);
  }
}
  return (
    <section className="skills-page">
      <header className="skills-hero">
        <div className="skills-hero-copy">
          <span className="skills-eyebrow"><Diamond size={16} aria-hidden="true" /> Kỹ năng & khóa học</span>
          <h1>Quản lý kỹ năng cá nhân</h1>
          <p>
            Theo dõi kỹ năng đã có, mức độ hiện tại và minh chứng học tập để hệ thống
            đề xuất roadmap phù hợp hơn.
          </p>

          <div className="skills-hero-metrics" aria-label="Skills summary">
            <div>
              <span>My skills</span>
              <strong>{stats.totalUser}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{stats.average}%</strong>
            </div>
            <div>
              <span>Verified</span>
              <strong>{stats.verified}</strong>
            </div>
          </div>
        </div>

        <div className="skills-hero-actions">
          <button type="button" onClick={() => startCreate()}>
            + Thêm kỹ năng
          </button>
          <button type="button" className="secondary" onClick={loadData}>
            Tải lại dữ liệu
          </button>
        </div>
      </header>

    <section className="skills-stats-grid">
  <article>
    <span>Kỹ năng của tôi</span>
    <strong>{stats.totalUser}</strong>
    <small>đã thêm vào hồ sơ</small>
  </article>

  <article>
    <span>Kho kỹ năng</span>
    <strong>{stats.totalCatalog}</strong>
    <small>kỹ năng khả dụng</small>
  </article>

  <article>
    <span>Level cao nhất</span>
    <strong>{stats.topLevel}</strong>
    <small>trong các kỹ năng đã thêm</small>
  </article>

  <article>
    <span>Đã xác minh</span>
    <strong>{stats.verified}</strong>
    <small>kỹ năng có xác nhận</small>
  </article>
</section>

<SkillGapPanel
  profile={profile}
  report={skillGapReport}
  loading={loadingSkillGap}
  analyzing={analyzingSkillGap}
  onAnalyze={handleAnalyzeSkillGap}
/>

      <section className="skills-layout">
        <aside className="skills-form-card">
          <div className="skills-card-head">
            <h2>{editingId ? 'Cập nhật kỹ năng' : 'Thêm kỹ năng mới'}</h2>
            <p>
              Chọn kỹ năng từ danh sách hệ thống, sau đó nhập level và minh chứng.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="skills-field">
              <span>Kỹ năng</span>
              <select
                name="skillId"
                value={form.skillId}
                onChange={updateField}
                disabled={Boolean(editingId)}
                required
              >
                <option value="">-- Chọn kỹ năng --</option>
                {availableSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {getSkillName(skill)} · {getSkillCategory(skill)}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-field">
              <span>Level hiện tại</span>
              <select name="level" value={form.level} onChange={updateField}>
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-field">
              <span>Loại minh chứng</span>
              <select name="evidenceType" value={form.evidenceType} onChange={updateField}>
                {EVIDENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="skills-field skills-evidence-field">
              <span>Link minh chứng</span>
              <div className="skills-evidence-input">
                <input
                  name="evidenceUrl"
                  value={form.evidenceUrl}
                  onChange={updateField}
                  placeholder="GitHub, certificate, portfolio..."
                />
                <div className="skills-evidence-tools" role="group" aria-label="Tải minh chứng">
                  <label
                    className="skills-evidence-tool skills-file-action"
                    title={uploadingEvidence ? 'Đang tải...' : 'Tải file lên'}
                    aria-label="Tải file minh chứng"
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,application/x-zip-compressed,.jpg,.jpeg,.png,.webp,.pdf,.zip"
                      onChange={handleEvidenceFileChange}
                      disabled={uploadingEvidence || saving}
                    />
                    {uploadingEvidence ? (
                      <span className="skills-evidence-spinner" aria-hidden="true" />
                    ) : (
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M8 11V3M8 3l-3 3m3-3l3 3M3 11v1a1 1 0 001 1h8a1 1 0 001-1v-1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </label>
                  <button
                    type="button"
                    className="skills-evidence-tool"
                    onClick={handleEvidenceImport}
                    disabled={!editingId || uploadingEvidence || saving || !isHttpUrl(form.evidenceUrl)}
                    title={editingId ? 'Nhập từ URL' : 'Lưu kỹ năng trước, sau đó dùng Nhập từ URL'}
                    aria-label="Nhập minh chứng từ URL"
                  >
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M6.5 9.5l3-3M5 11a2.5 2.5 0 01-1.77-4.27l1.5-1.5M11 5a2.5 2.5 0 011.77 4.27l-1.5 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </label>

            {!editingId && pendingEvidenceFile ? (
              <small className="skills-evidence-hint">
                Đã chọn “{pendingEvidenceFile.name}”. File sẽ được tải lên sau khi bạn lưu kỹ năng.
              </small>
            ) : (
              <small className="skills-evidence-hint">
                {EVIDENCE_FILE_HINT}
              </small>
            )}
            {editingId && form.evidenceUrl.trim() && !isHttpUrl(form.evidenceUrl) && !form.evidenceUrl.startsWith('Đang chờ upload: ') && (
              <small className="skills-evidence-hint">
                Link hiện tại là đường dẫn storage nội bộ. Dùng "Xem minh chứng" sau khi lưu, hoặc nhập URL http/https để import file mới.
              </small>
            )}

            <div className="skills-form-actions">
              <button type="submit" disabled={saving || !form.skillId}>
                {saving ? 'Đang lưu...' : editingId ? 'Lưu cập nhật' : 'Thêm kỹ năng'}
              </button>

              {(editingId || form.skillId || form.evidenceUrl) && (
                <button type="button" className="ghost" onClick={cancelEdit}>
                  Hủy
                </button>
              )}
            </div>
          </form>
        </aside>

        <main className="skills-main-panel">
          <section className="skills-toolbar">
            <div className="skills-search">
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kỹ năng, category, level..."
              />
            </div>

            <div className="skills-category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? 'active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === 'all' ? 'Tất cả' : category}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <section className="skills-empty">
              <span><LoaderCircle size={28} aria-hidden="true" /></span>
              <h2>Đang tải kỹ năng</h2>
              <p>Vui lòng chờ trong giây lát.</p>
            </section>
          ) : (
            <>
              <section className="skills-section">
                <div className="skills-section-head">
                  <div>
                    <h2>Kỹ năng của tôi</h2>
                    <p>Danh sách kỹ năng bạn đã thêm vào hồ sơ.</p>
                  </div>
                  <span>{filteredUserSkills.length} kỹ năng</span>
                </div>

                {filteredUserSkills.length === 0 ? (
                  <div className="skills-empty compact">
                    <span><Pin size={28} aria-hidden="true" /></span>
                    <h2>Chưa có kỹ năng phù hợp</h2>
                    <p>Thêm kỹ năng mới hoặc đổi bộ lọc tìm kiếm.</p>
                  </div>
                ) : (
                  <div className="user-skill-grid">
                    {filteredUserSkills.map((userSkill) => (
                      <UserSkillCard
                        key={userSkill.id}
                        userSkill={userSkill}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        session={session}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="skills-section">
                <div className="skills-section-head">
                  <div>
                    <h2>Kho kỹ năng hệ thống</h2>
                    <p>Chọn nhanh kỹ năng để thêm vào hồ sơ cá nhân.</p>
                  </div>
                  <span>{filteredCatalogSkills.length} kỹ năng</span>
                </div>

                <div className="catalog-skill-grid">
                  {filteredCatalogSkills.map((skill) => {
                    const added = addedSkillIds.has(skill.id);

                    return (
                      <article key={skill.id} className={added ? 'catalog-skill-card added' : 'catalog-skill-card'}>
                        <div>
                          <span>{getSkillCategory(skill)}</span>
                          <h3>{getSkillName(skill)}</h3>
                          <p>{getSkillDescription(skill)}</p>
                        </div>

                        <button
                          type="button"
                          disabled={added}
                          onClick={() => startCreate(skill.id)}
                        >
                          {added ? 'Đã thêm' : '+ Thêm'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      </section>
    </section>
  );
}

function UserSkillCard({ userSkill, onEdit, onDelete, session }) {
  const levelClass = getLevelClass(userSkill.level);
  const levelLabel = userSkill.level || 'Chưa có';
  const [downloading, setDownloading] = useState(false);

  const getObjectNameFromUrl = (url) => {
    if (!url) return '';
    const match = String(url).match(/[?&]objectName=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : url;
  };

  const handleViewEvidence = async (e) => {
    e.preventDefault();
    if (downloading) return;
    const url = userSkill.evidenceUrl;
    if (!url) return;

    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setDownloading(true);
    try {
      const objectName = getObjectNameFromUrl(url);
      const response = await getSignedUrl(session, objectName);
      if (response?.url) {
        window.open(response.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error("Không lấy được đường dẫn tải file.");
      }
    } catch (err) {
      toast.error(err.message || "Không thể tải minh chứng.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className={`user-skill-card ${levelClass}`}>
      <div className="user-skill-top">
        <div>
          <span>{userSkill.skillCategory || 'Khác'}</span>
          <h3>{userSkill.skillName || 'Kỹ năng chưa xác định'}</h3>
        </div>

        <span className={`user-skill-level-badge ${levelClass}`}>{levelLabel}</span>
      </div>

      <div className="user-skill-meta">
        <span>
          Trạng thái:{' '}
          <b>{userSkill.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}</b>
        </span>
        <span>Cập nhật: <b>{formatDate(userSkill.updatedAt)}</b></span>
      </div>

      {userSkill.evidenceUrl && (
        <a
          href="#"
          onClick={handleViewEvidence}
          className="user-skill-evidence"
        >
          {downloading ? 'Đang tải...' : `Xem minh chứng · ${userSkill.evidenceType || 'Evidence'}`}
        </a>
      )}

      <div className="user-skill-actions">
        <button type="button" onClick={() => onEdit(userSkill)}>
          Chỉnh sửa
        </button>
        <button type="button" className="danger" onClick={() => onDelete(userSkill)}>
          Xóa
        </button>
      </div>
    </article>
  );
}
function getSkillGapItems(report) {
  if (!report) return [];

  const possibleLists = [
    report.gaps,
    report.skillGaps,
    report.items,
    report.details,
    report.missingSkills,
    report.skillGapDetails,
  ];

  const list = possibleLists.find(Array.isArray);

  return list || [];
}

function getReportScore(report) {
  return (
    report?.matchScore ??
    report?.score ??
    report?.overallScore ??
    report?.readinessScore ??
    report?.progress ??
    0
  );
}

function SkillGapPanel({
  profile,
  report,
  loading,
  analyzing,
  onAnalyze,
}) {
  const items = getSkillGapItems(report);
  const score = Number(getReportScore(report) || 0);
  const targetRoleId = profile?.targetRoleId;
  const targetRoleName = profile?.targetRoleName;
  const reportRoleName = report?.careerRoleName;

  return (
    <section className="skill-gap-panel">
      <div className="skill-gap-head">
        <div>
          <span className="skill-gap-eyebrow">Skill gap analysis</span>
          <h2>Phân tích khoảng cách kỹ năng</h2>
          <p>
            Hệ thống dùng vai trò mục tiêu trong hồ sơ để so sánh với kỹ năng hiện tại của bạn.
          </p>
        </div>

        <div className="skill-gap-actions">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing || loading || !targetRoleId}
          >
            {analyzing ? 'Đang phân tích...' : 'Phân tích lại'}
          </button>
        </div>
      </div>

      <div className="skill-gap-target">
        <span>Vai trò mục tiêu</span>
        <strong>
          {targetRoleName ||
            (targetRoleId ? 'Vai trò chưa có tên' : 'Chưa chọn vai trò trong hồ sơ')}
        </strong>
      </div>

      {loading ? (
        <div className="skill-gap-empty">
          <span><LoaderCircle size={28} aria-hidden="true" /></span>
          <h3>Đang tải báo cáo skill gap</h3>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      ) : !report ? (
        <div className="skill-gap-empty">
          <span><BarChart3 size={28} aria-hidden="true" /></span>
          <h3>Chưa có báo cáo skill gap</h3>
          <p>
            {targetRoleId
              ? 'Bấm “Phân tích lại” để tạo báo cáo từ vai trò mục tiêu trong hồ sơ.'
              : 'Cập nhật vai trò mục tiêu trong hồ sơ trước, sau đó quay lại phân tích.'}
          </p>
        </div>
      ) : (
        <div className="skill-gap-result">
          <div className="skill-gap-score-card">
            <div>
              <span>Điểm phù hợp</span>
              <strong>{score}%</strong>
              <small>
                {reportRoleName ? `Vai trò: ${reportRoleName}` : 'Báo cáo gần nhất'}
              </small>
            </div>

            <div className="skill-gap-score-line">
              <span style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
            </div>
          </div>

          <div className="skill-gap-meta-grid">
            <div>
              <span>Số kỹ năng cần bổ sung</span>
              <strong>{items.length}</strong>
            </div>

            <div>
              <span>Cập nhật</span>
              <strong>{formatDate(report.updatedAt || report.createdAt)}</strong>
            </div>
          </div>

          {items.length > 0 && (
            <div className="skill-gap-list">
              {items.map((item, index) => (
                <article key={item.id || index} className="skill-gap-item">
                  <div>
                    <span>{item.skillCategory || item.category || 'Skill'}</span>
                    <h3>{item.skillName || item.name || item.title || `Kỹ năng #${index + 1}`}</h3>
                    <p>{item.description || item.recommendation || item.note || 'Chưa có mô tả.'}</p>
                  </div>

                  <div className="skill-gap-levels">
                    <small>
                      Hiện tại:{' '}
                      <b>{item.currentLevel || item.userLevel || item.level || 'Chưa có'}</b>
                    </small>
                    <small>
                      Yêu cầu:{' '}
                      <b>{item.requiredLevel || item.targetLevel || item.expectedLevel || 'N/A'}</b>
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
