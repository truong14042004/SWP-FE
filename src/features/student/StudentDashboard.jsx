import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { apiUrl } from '../../config';
import '../../styles.css';
import { StudentProfileForm } from './components/StudentProfileForm';
import {
  createStudentProfile,
  getCareerRoles,
  getStudentProfile,
  importStudentAvatarFromUrl,
  updateStudentProfile,
  uploadStudentAvatar,
} from './studentApi';
import { StudentPortfolioPage } from './components/StudentPortfolioPage';
import { StudentRoadmapPage } from './components/StudentRoadmapPage';
import { StudentSkillsPage } from './components/StudentSkillsPage';
import { StudentGithubPage } from './components/StudentGithubPage';
import { StudentMentorPage } from './components/StudentMentorPage';
const STUDENT_SECTIONS = [
  { id: 'overview', label: 'Bảng điều khiển' },
  { id: 'roadmap', label: 'Lộ trình nghề nghiệp' },
  { id: 'skills', label: 'Kỹ năng & Phân tích' },
  { id: 'github', label: 'Tích hợp GitHub' },
  { id: 'portfolio', label: 'Xây dựng Portfolio' },
  { id: 'mentors', label:'AI tư vấn'},
  { id: 'settings', label: 'Cài đặt' },
];

const SECTION_META = {
  overview: {
    eyebrow: 'Student dashboard',
    title: 'Tổng quan tiến độ học tập',
    subtitle: 'Theo dõi mức độ sẵn sàng, kỹ năng còn thiếu và các việc cần ưu tiên cho vai trò',
  },
  roadmap: {
    eyebrow: 'Career roadmap',
    title: 'Lộ trình nghề nghiệp cá nhân',
    subtitle: 'Các mốc học tập được sắp xếp theo thứ tự ưu tiên cho vai trò',
  },
  skills: {
    eyebrow: 'Skill gap analysis',
    title: 'Kỹ năng và khóa học đề xuất',
    subtitle: 'Tập trung vào nhóm kỹ năng còn thiếu hoặc cần cải thiện cho vai trò',
  },
  mentors: {
    eyebrow: 'Mentor sessions',
    title: 'Lịch hẹn tư vấn sắp tới',
    subtitle: 'Chuẩn bị trước nội dung cần hỏi mentor để rút ngắn thời gian đạt mục tiêu',
  },
  community: {
    eyebrow: 'Mentor community',
    title: 'Cộng đồng mentor và hoạt động mới',
    subtitle: 'Cập nhật thảo luận, tài nguyên và lời khuyên liên quan đến vai trò',
  },
};

const SKILL_TABS = [
  { id: 'all', label: 'Tất cả kỹ năng (19)' },
  { id: 'missing', label: 'Thiếu (3)' },
  { id: 'weak', label: 'Còn yếu (4)' },
  { id: 'done', label: 'Đã đạt (12)' },
];

const SKILL_GROUPS = {
  missing: [
    { name: 'Microservices Architecture', current: '0/5', target: '3/5', action: 'Học ngay' },
    { name: 'Docker & Kubernetes', current: '0/5', target: '3/5', action: 'Học ngay' },
  ],
  weak: [
    { name: 'Node.js Performance Tuning', current: '2/5', target: '4/5', action: 'Cải thiện', progress: 52 },
  ],
  done: [
    { name: 'RESTful API Design', current: '4/5', target: '3/5', action: 'Đạt yêu cầu' },
  ],
};

const DASHBOARD_METRICS = [
  { label: 'Match score', value: '75%', caption: '+8% so với tuần trước', tone: 'primary' },
  { label: 'Kỹ năng đạt', value: '12/19', caption: '3 kỹ năng cần ưu tiên', tone: 'success' },
  { label: 'Giờ học tuần này', value: '18h', caption: 'Mục tiêu 20h/tuần', tone: 'warning' },
  { label: 'Mentor session', value: '02', caption: '1 lịch hẹn hôm nay', tone: 'info' },
];

const ROADMAP_STEPS = [
  { title: 'Nền tảng Backend', detail: 'RESTful API, authentication, database design', status: 'Hoàn thành', progress: 100 },
  { title: 'Hiệu năng Node.js', detail: 'Caching, queue, profiling và tối ưu request', status: 'Đang học', progress: 52 },
  { title: 'Microservices', detail: 'Service discovery, API gateway, event-driven design', status: 'Tiếp theo', progress: 18 },
  { title: 'Triển khai production', detail: 'Docker, Kubernetes, logging và monitoring', status: 'Chưa bắt đầu', progress: 0 },
];

const LEARNING_QUEUE = [
  { title: 'Docker căn bản đến thực chiến', duration: '6 giờ', level: 'Bắt buộc' },
  { title: 'Node.js Performance Tuning', duration: '4 giờ', level: 'Nên học' },
  { title: 'Microservices Architecture', duration: '8 giờ', level: 'Ưu tiên cao' },
];

const MENTOR_SESSIONS = [
  { mentor: 'Anh Minh Nguyen', topic: 'Review lộ trình Backend', time: 'Hôm nay, 20:00' },
  { mentor: 'Chị Linh Tran', topic: 'Mock interview API design', time: 'Thứ 6, 19:30' },
];

const COMMUNITY_ITEMS = [
  { title: 'Checklist chuẩn bị phỏng vấn Backend Fresher', meta: '23 phản hồi' },
  { title: 'Tài nguyên học Docker cho sinh viên năm cuối', meta: 'Mentor đề xuất' },
];

const emptyProfile = {
  school: '',
  major: '',
  year: '',
  gpa: '',
  avatarUrl: '',
  targetRoleId: '',
  githubUsername: '',
  careerGoal: '',
  preferredLearningHoursPerWeek: '',
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function renderStars(count) {
  return Array.from({ length: count }, (_, index) => <span key={index}>★</span>);
}

function normalizeProfile(profile) {
  if (!profile) return emptyProfile;
  return {
    school: profile.school || '',
    major: profile.major || '',
    year: profile.year ?? '',
    gpa: profile.gpa ?? '',
    avatarUrl: profile.avatarUrl || '',
    targetRoleId: profile.targetRoleId || '',
    githubUsername: profile.githubUsername || '',
    careerGoal: profile.careerGoal || '',
    preferredLearningHoursPerWeek: profile.preferredLearningHoursPerWeek ?? '',
  };
}

function profilePayload(form) {
  return {
    school: form.school.trim(),
    major: form.major.trim(),
    year: Number(form.year),
    gpa: Number(form.gpa),
    avatarUrl: form.avatarUrl.trim() || null,
    targetRoleId: form.targetRoleId,
    githubUsername: form.githubUsername.trim() || null,
    careerGoal: form.careerGoal.trim(),
    preferredLearningHoursPerWeek: Number(form.preferredLearningHoursPerWeek),
  };
}

function getRoleId(role) {
  return role?.id ?? role?.roleId ?? role?.careerRoleId ?? role?.value;
}

function getRoleName(role) {
  return role?.name || role?.title || role?.roleName || role?.label;
}

function resolveAvatarSrc(avatarUrl, userId) {
  if (!avatarUrl) {
    return '';
  }

  const normalizedAvatarUrl = avatarUrl.trim();

  if (/^https?:\/\//i.test(normalizedAvatarUrl)) {
    return normalizedAvatarUrl;
  }

  if (!apiUrl) {
    return '';
  }

  if (normalizedAvatarUrl.startsWith('/api/storage/public/')) {
    return `${apiUrl}${normalizedAvatarUrl}`;
  }

  if (normalizedAvatarUrl.startsWith('api/storage/public/')) {
    return `${apiUrl}/${normalizedAvatarUrl}`;
  }

  const objectPath = normalizedAvatarUrl.replace(/^\/+/, '');
  const avatarFolderMatch = objectPath.match(/^(users\/[^/]+\/avatar)(?:\/.*)?$/i);

  if (avatarFolderMatch) {
    return `${apiUrl}/api/storage/public/${avatarFolderMatch[1]}/download`;
  }

  if (userId) {
    return `${apiUrl}/api/storage/public/users/${userId}/avatar/download`;
  }

  return `${apiUrl}/api/storage/public/${objectPath}/download`;
}

export function StudentDashboard({ session, onSignOut, onNavigateHome }) {
  function getInitialStudentSection() {
  const hashSection = window.location.hash.replace('#', '');

  return STUDENT_SECTIONS.some((section) => section.id === hashSection)
    ? hashSection
    : 'overview';
}

const [activeSection, setActiveSection] = useState(getInitialStudentSection);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState(emptyProfile);
  const [careerRoles, setCareerRoles] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const initials = getInitials(session?.user?.fullName);
  const firstName = session?.user?.fullName?.split(' ')?.slice(-1)?.[0] || 'bạn';
  const sectionMeta = SECTION_META[activeSection] || SECTION_META.overview;
  const avatarSrc = useMemo(
    () => resolveAvatarSrc(session?.user?.avatarUrl || form.avatarUrl, session?.user?.id),
    [form.avatarUrl, session?.user?.avatarUrl, session?.user?.id],
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const visibleGroups = useMemo(() => {
    if (activeTab === 'missing') return ['missing'];
    if (activeTab === 'weak') return ['weak'];
    if (activeTab === 'done') return ['done'];
    return ['missing', 'weak', 'done'];
  }, [activeTab]);

  const targetRoleName = useMemo(() => {
    const selectedRole = careerRoles.find((role) => String(getRoleId(role)) === String(form.targetRoleId));
    return getRoleName(selectedRole) || 'Backend Developer';
  }, [careerRoles, form.targetRoleId]);

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const [roles, profileResult] = await Promise.all([
        getCareerRoles().catch(() => []),
        getStudentProfile(session)
          .then((profile) => ({ profile, hasProfile: true }))
          .catch((requestError) => {
            if (requestError?.status === 404) {
              return { profile: null, hasProfile: false };
            }
            throw requestError;
          }),
      ]);

      setCareerRoles(Array.isArray(roles) ? roles.filter((role) => role.isActive !== false) : []);
      setForm(normalizeProfile(profileResult.profile));
      setHasProfile(profileResult.hasProfile);
    } catch (requestError) {
      toast.error(requestError.message || 'Khong tai duoc ho so sinh vien.');
    } finally {
      setLoadingProfile(false);
    }
  }

  function updateField(event) {
    const { name, value, type, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadStudentAvatar(session, file);
      const nextAvatarUrl = uploaded?.downloadPath || uploaded?.objectName || '';
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      toast.success('Da upload avatar.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong upload duoc avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarImport() {
    const avatarUrl = form.avatarUrl.trim();
    if (!avatarUrl) {
      toast.error('Vui long nhap URL avatar.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileName = avatarUrl.split('/').pop()?.split('?')[0] || 'avatar';
      const imported = await importStudentAvatarFromUrl(session, { url: avatarUrl, fileName });
      const nextAvatarUrl = imported?.downloadPath || imported?.objectName || avatarUrl;
      setForm((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      toast.success('Da import avatar tu URL.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong import duoc avatar tu URL.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = profilePayload(form);
      const saved = hasProfile
        ? await updateStudentProfile(session, payload)
        : await createStudentProfile(session, payload);

      setForm(normalizeProfile(saved));
      setHasProfile(true);
      toast.success(hasProfile ? 'Da cap nhat ho so.' : 'Da tao ho so.');
    } catch (requestError) {
      toast.error(requestError.message || 'Khong luu duoc ho so.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="admin-shell student-shell">
      <aside className="admin-sidebar student-sidebar">
        <div className="student-brand">
          <span className="student-brand-mark">SWP</span>
          <div>
            <strong>Career Compass</strong>
            <span>Chào mừng {firstName} quay trở lại</span>
          </div>
        </div>

        <nav className="admin-nav student-nav" aria-label="Student sections">
          {STUDENT_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                setActiveSection(section.id);
                window.history.replaceState({}, '', `#${section.id}`);
              }}
            >
              <span className="student-nav-dot" />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="student-sidebar-footer">
          <button type="button" className="student-upgrade-btn">Nâng cấp tài khoản</button>
          <div className="admin-account">
            <div className="admin-account-info">
              {avatarSrc ? (
                <img className="admin-account-avatar" src={avatarSrc} alt="Student avatar" />
              ) : (
                <span className="admin-account-avatar">{initials}</span>
              )}
              <div>
                <strong>{session?.user?.fullName}</strong>
                <small>{session?.user?.email}</small>
              </div>
            </div>
            <button type="button" onClick={onSignOut}>Đăng xuất</button>
          </div>
        </div>
      </aside>

      <section className="admin-main student-main">
       {!['portfolio', 'roadmap','skills','github','mentors'].includes(activeSection) && (
  <header className="student-header-bar">
    <button type="button" className="student-search-bar" onClick={() => setActiveSection('skills')}>
      <span>⌕</span>
      Tìm kiếm khóa học, mentor, kỹ năng...
    </button>

    <div className="student-header-actions">
      <button type="button" className="student-icon-btn" aria-label="Thông báo">🔔</button>
      <button type="button" className="student-avatar-chip" onClick={() => setActiveSection('settings')}>
        {avatarSrc ? <img src={avatarSrc} alt="Student avatar" /> : initials}
      </button>
    </div>
  </header>
)}

     {activeSection === 'portfolio' ? (
  <StudentPortfolioPage session={session} />
) : activeSection === 'roadmap' ? (
  <StudentRoadmapPage session={session} />
) : activeSection === 'skills' ? (
  <StudentSkillsPage session={session} />
) : activeSection === 'github' ? (
  <StudentGithubPage session={session} />
) : activeSection === 'mentors' ? (
  <StudentMentorPage session={session} />
) : activeSection === 'settings' ? (
          <section className="student-profile-page">
            <div className="student-profile-heading">
              <button type="button" className="student-back-link" onClick={() => setActiveSection('overview')}>← Quay lại dashboard</button>
              <h1>Quản lý hồ sơ</h1>
              <p>Cập nhật thông tin học vấn và mục tiêu nghề nghiệp của bạn.</p>
            </div>

            <StudentProfileForm
              initials={initials}
              avatarSrc={avatarSrc}
              form={form}
              careerRoles={careerRoles}
              loadingProfile={loadingProfile}
              savingProfile={savingProfile}
              uploadingAvatar={uploadingAvatar}
              hasProfile={hasProfile}
              onChange={updateField}
              onAvatarFileChange={handleAvatarFileChange}
              onAvatarImport={handleAvatarImport}
              onReload={loadProfile}
              onSubmit={handleSaveProfile}
            />
          </section>
        ) : (
          <>
            <header className="student-topbar">
              <div className="student-topbar-copy">
                <button type="button" className="student-back-link" onClick={onNavigateHome}>← Quay lại trang chủ</button>
                <span className="student-eyebrow">{sectionMeta.eyebrow}</span>
                <h1>{sectionMeta.title}</h1>
                <p>{sectionMeta.subtitle} <strong>{targetRoleName}</strong>.</p>
              </div>
              <div className="student-topbar-actions">
                <button type="button" className="student-secondary-btn" onClick={() => setActiveSection('settings')}>Cập nhật hồ sơ</button>
                <button type="button" className="student-cta-btn">Tạo lộ trình cá nhân hóa</button>
              </div>
            </header>

            <section className="student-overview-grid" aria-label="Student metrics">
              {DASHBOARD_METRICS.map((metric) => (
                <article key={metric.label} className={`student-metric-card ${metric.tone}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.caption}</small>
                </article>
              ))}
            </section>

            <section className="student-dashboard-layout">
              <article className="student-score-card">
                <div className="student-panel-heading">
                  <span>Readiness</span>
                  <h2>Độ phù hợp</h2>
                  <p>Mức độ sẵn sàng hiện tại cho vai trò {targetRoleName}</p>
                </div>

                <div className="student-score-ring">
                  <div className="student-score-ring-inner">
                    <strong>75%</strong>
                    <span>Match score</span>
                  </div>
                </div>

                <div className="student-score-stats">
                  <div>
                    <strong>12</strong>
                    <span>Đã đạt</span>
                  </div>
                  <div>
                    <strong>4</strong>
                    <span>Còn yếu</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>Thiếu</span>
                  </div>
                </div>
              </article>

              <article className="student-roadmap-card">
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Roadmap</span>
                    <h2>Lộ trình 4 giai đoạn</h2>
                  </div>
                  <button type="button" onClick={() => setActiveSection('roadmap')}>Xem chi tiết</button>
                </div>

                <div className="student-roadmap-list">
                  {ROADMAP_STEPS.map((step, index) => (
                    <div key={step.title} className="student-roadmap-step">
                      <span className="student-roadmap-index">{index + 1}</span>
                      <div>
                        <div className="student-roadmap-step-head">
                          <strong>{step.title}</strong>
                          <small>{step.status}</small>
                        </div>
                        <p>{step.detail}</p>
                        <div className="student-progress slim">
                          <span style={{ width: `${step.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="student-content-grid">
              <article className="student-gap-panel">
                <div className="student-panel-heading horizontal">
                  <div>
                    <span>Skill gap</span>
                    <h2>Kỹ năng cần tập trung</h2>
                  </div>
                </div>

                <div className="student-skill-tabs">
                  {SKILL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {visibleGroups.includes('missing') && (
                  <div className="student-group">
                    <h3 className="student-group-title danger">Kỹ năng đang thiếu</h3>
                    {SKILL_GROUPS.missing.map((skill) => (
                      <div key={skill.name} className="student-skill-card missing">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                            <span className="student-stars">{renderStars(3)}</span>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                        </div>
                        <button type="button">{skill.action}</button>
                      </div>
                    ))}
                  </div>
                )}

                {visibleGroups.includes('weak') && (
                  <div className="student-group">
                    <h3 className="student-group-title warning">Kỹ năng cần cải thiện</h3>
                    {SKILL_GROUPS.weak.map((skill) => (
                      <div key={skill.name} className="student-skill-card weak">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                            <span className="student-stars">{renderStars(3)}</span>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                          <div className="student-progress">
                            <span style={{ width: `${skill.progress}%` }} />
                          </div>
                        </div>
                        <button type="button">{skill.action}</button>
                      </div>
                    ))}
                  </div>
                )}

                {visibleGroups.includes('done') && (
                  <div className="student-group">
                    <h3 className="student-group-title success">Kỹ năng đã đạt</h3>
                    {SKILL_GROUPS.done.map((skill) => (
                      <div key={skill.name} className="student-skill-card done">
                        <div>
                          <div className="student-skill-title">
                            <strong>{skill.name}</strong>
                          </div>
                          <p>Hiện tại: <b>{skill.current}</b> <span>→</span> Yêu cầu: <b>{skill.target}</b></p>
                        </div>
                        <button type="button">{skill.action}</button>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <aside className="student-right-rail">
                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>Learning queue</span>
                    <h2>Khóa học ưu tiên</h2>
                  </div>
                  <div className="student-compact-list">
                    {LEARNING_QUEUE.map((item) => (
                      <button key={item.title} type="button" className="student-compact-item">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.duration}</small>
                        </div>
                        <span>{item.level}</span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>Mentor</span>
                    <h2>Lịch tư vấn</h2>
                  </div>
                  <div className="student-compact-list">
                    {MENTOR_SESSIONS.map((sessionItem) => (
                      <div key={sessionItem.topic} className="student-compact-item static">
                        <div>
                          <strong>{sessionItem.topic}</strong>
                          <small>{sessionItem.mentor}</small>
                        </div>
                        <span>{sessionItem.time}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="student-side-card">
                  <div className="student-panel-heading">
                    <span>Community</span>
                    <h2>Hoạt động mới</h2>
                  </div>
                  <div className="student-compact-list">
                    {COMMUNITY_ITEMS.map((item) => (
                      <button key={item.title} type="button" className="student-compact-item">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                        <span>→</span>
                      </button>
                    ))}
                  </div>
                </article>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
