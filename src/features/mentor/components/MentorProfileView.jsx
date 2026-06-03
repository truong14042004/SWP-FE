import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Camera, Mail, ShieldAlert, Award } from 'lucide-react';
import { getMentorProfile, updateMyMentorProfile, uploadMentorAvatar } from '../api/industryMentorApi';

const apiUrl = import.meta.env.VITE_API_URL || '';

function resolveAvatarSrc(avatarUrl, userId) {
  if (!avatarUrl) return '';
  const trimmed = avatarUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/api/storage/public/')) return `${apiUrl}${trimmed}`;
  if (trimmed.startsWith('api/storage/public/')) return `${apiUrl}/${trimmed}`;
  return `${apiUrl}/api/storage/public/users/${userId}/avatar/download`;
}

export function MentorProfileView({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    company: '',
    jobTitle: '',
    yearsOfExperience: 0,
    bio: '',
    linkedInUrl: '',
  });

  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getMentorProfile(session, session.user.id);
      setProfile(data);
      setForm({
        company: data.profile?.company || '',
        jobTitle: data.profile?.jobTitle || '',
        yearsOfExperience: data.profile?.yearsOfExperience || 0,
        bio: data.profile?.bio || '',
        linkedInUrl: data.profile?.linkedInUrl || '',
      });
    } catch (error) {
      toast.error(error.message || 'Không thể tải hồ sơ mentor.');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'yearsOfExperience' ? Number(value) : value,
    }));
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    setPendingAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPendingAvatarPreview(objectUrl);
  }

  function clearPendingAvatar() {
    if (pendingAvatarPreview) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
  }

  useEffect(() => {
    return () => {
      if (pendingAvatarPreview) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [pendingAvatarPreview]);

  const avatarSrc = useMemo(() => {
    if (pendingAvatarPreview) return pendingAvatarPreview;
    return resolveAvatarSrc(profile?.avatarUrl, session?.user?.id);
  }, [pendingAvatarPreview, profile?.avatarUrl, session?.user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      let latestAvatarUrl = profile?.avatarUrl;

      // 1) Upload avatar file if selected
      if (pendingAvatarFile) {
        setUploadingAvatar(true);
        try {
          const result = await uploadMentorAvatar(session, pendingAvatarFile);
          latestAvatarUrl = result.objectName; // update avatar url
          clearPendingAvatar();
        } finally {
          setUploadingAvatar(false);
        }
      }

      // 2) Save profile details
      const payload = {
        company: form.company,
        jobTitle: form.jobTitle,
        yearsOfExperience: form.yearsOfExperience,
        bio: form.bio,
        linkedInUrl: form.linkedInUrl,
      };

      const updated = await updateMyMentorProfile(session, payload);
      setProfile({
        ...updated,
        avatarUrl: latestAvatarUrl, // preserve local file URL updates
      });
      
      toast.success('Hồ sơ của bạn đã được cập nhật thành công.');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <p>Đang tải thông tin hồ sơ của bạn...</p>
      </div>
    );
  }

  const initials = (profile?.fullName || 'M')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="form-card" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--card-bg)' }}>
      <form onSubmit={handleSubmit} className="field-stack">
        {/* Profile Hero Header with Avatar Upload */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile?.fullName}
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
              />
            ) : (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#fff',
                }}
              >
                {initials}
              </div>
            )}
            
            <label
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                backgroundColor: 'var(--primary)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <Camera size={16} color="#fff" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
                disabled={saving || uploadingAvatar}
              />
            </label>
          </div>

          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--text-main)' }}>{profile?.fullName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Mail size={14} />
              <span>{profile?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>
              <Award size={14} />
              <span>{profile?.role === 'IndustryMentor' ? 'Industry Mentor' : 'Academic Counselor'}</span>
            </div>
          </div>
        </div>

        {pendingAvatarPreview && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.2)', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'orange' }}>Ảnh đại diện mới đã chọn (sẵn sàng lưu)</span>
            <button
              type="button"
              onClick={clearPendingAvatar}
              style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              Hủy bỏ
            </button>
          </div>
        )}

        <div className="field-row">
          <label>
            <span>Công ty / Tổ chức</span>
            <input
              name="company"
              value={form.company}
              onChange={handleFieldChange}
              placeholder="Ví dụ: Google, FPT Software..."
              disabled={saving}
            />
          </label>

          <label>
            <span>Chức danh chuyên môn</span>
            <input
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleFieldChange}
              placeholder="Ví dụ: Senior Developer, Tech Lead..."
              disabled={saving}
            />
          </label>
        </div>

        <div className="field-row">
          <label>
            <span>Số năm kinh nghiệm</span>
            <input
              name="yearsOfExperience"
              type="number"
              min="0"
              value={form.yearsOfExperience}
              onChange={handleFieldChange}
              disabled={saving}
            />
          </label>

          <label>
            <span>LinkedIn URL</span>
            <input
              name="linkedInUrl"
              value={form.linkedInUrl}
              onChange={handleFieldChange}
              placeholder="https://linkedin.com/in/username"
              disabled={saving}
            />
          </label>
        </div>

        <label>
          <span>Giới thiệu bản thân (Bio)</span>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleFieldChange}
            placeholder="Mô tả tóm tắt kinh nghiệm làm việc, thế mạnh công nghệ và cách bạn có thể hỗ trợ học viên..."
            rows={5}
            disabled={saving}
          />
        </label>

        {profile?.stats && (
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '24px' }}>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tổng số lượt đã review</small>
              <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>{profile.stats.totalFeedbacksGiven} lượt</strong>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Điểm sao trung bình</small>
              <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>★ {profile.stats.averageRating ? profile.stats.averageRating.toFixed(1) : '0.0'} / 5.0</strong>
            </div>
          </div>
        )}

        <div className="button-row" style={{ marginTop: '24px' }}>
          <button type="submit" className="pill-button" disabled={saving || uploadingAvatar}>
            {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  );
}
