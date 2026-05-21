import { CareerRoleSelect } from './CareerRoleSelect';
import { apiUrl } from '../../../config';

export function StudentProfileForm({
  initials,
  avatarSrc,
  form,
  avatarImportDraft = '',
  onAvatarImportDraftChange,
  careerRoles,
  loadingProfile,
  savingProfile,
  uploadingAvatar,
  uploadingCv,
  hasProfile,
  onChange,
  onAvatarFileChange,
  onCvFileChange,
  onAvatarImport,
  onSubmit,
}) {
  return (
    <form className="student-profile-card plan-form" onSubmit={onSubmit}>
      <div className="student-profile-hero">
        <div className="student-profile-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Student avatar" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="student-profile-hero-copy">
          <h2>Ảnh đại diện</h2>
          <p>Tải ảnh từ máy của bạn — ảnh sẽ được lưu vào bucket và hiển thị ngay.</p>
          <div className="student-avatar-controls">
            <label className="secondary-action student-avatar-upload">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onAvatarFileChange}
                disabled={loadingProfile || savingProfile || uploadingAvatar}
              />
              {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh'}
            </label>
          </div>
        </div>
      </div>

      <div className="student-profile-section-label">Thông tin học vấn</div>
      <div className="student-profile-grid">
        <label>
          <span>Trường học</span>
          <input name="school" value={form.school} onChange={onChange} placeholder="Nhập trường học" required />
        </label>
        <label>
          <span>Chuyên ngành</span>
          <input name="major" value={form.major} onChange={onChange} placeholder="Nhập chuyên ngành" required />
        </label>
        <label>
          <span>Năm học</span>
          <select name="year" value={form.year} onChange={onChange} required>
            <option value="">Chọn năm học</option>
            <option value="1">Năm 1</option>
            <option value="2">Năm 2</option>
            <option value="3">Năm 3</option>
            <option value="4">Năm 4</option>
            <option value="5">Năm 5+</option>
          </select>
        </label>
        <label>
          <span>GPA hiện tại (0.0 - 4.0)</span>
          <input name="gpa" type="number" min="0" max="4" step="0.01" value={form.gpa} onChange={onChange} placeholder="3.5" required />
        </label>
      </div>

      <div className="student-profile-section-label">Mục tiêu nghề nghiệp</div>
      <div className="student-profile-grid single">
        <label>
          <span>Mục tiêu ngắn hạn / dài hạn</span>
          <textarea
            name="careerGoal"
            value={form.careerGoal}
            onChange={onChange}
            placeholder="Mô tả hướng đi nghề nghiệp của bạn"
            required
          />
        </label>
      </div>

      <div className="student-profile-grid">
        <CareerRoleSelect roles={careerRoles} value={form.targetRoleId} onChange={onChange} required />
        <label>
          <span>Thời gian học mỗi tuần (giờ/tuần)</span>
          <input
            name="preferredLearningHoursPerWeek"
            type="number"
            min="0"
            step="1"
            value={form.preferredLearningHoursPerWeek}
            onChange={onChange}
            placeholder="20"
            required
          />
        </label>
        <label>
          <span>Github username</span>
          <input name="githubUsername" value={form.githubUsername} onChange={onChange} placeholder="your-github-id" />
        </label>
      </div>

      <div className="student-profile-section-label">Hồ sơ cá nhân (CV)</div>
      <div className="student-profile-grid single">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Tải lên CV của bạn dưới dạng file PDF (tối đa 10MB) để hệ thống và AI Mentor có thêm thông tin định hướng.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label className="secondary-action student-avatar-upload" style={{ margin: 0, cursor: 'pointer' }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={onCvFileChange}
                disabled={loadingProfile || savingProfile || uploadingCv}
                style={{ display: 'none' }}
              />
              {uploadingCv ? 'Đang tải CV...' : 'Tải CV mới (PDF)'}
            </label>
            {form.cvUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <a
                  href={`${apiUrl}/api/storage/download?objectName=${encodeURIComponent(form.cvUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontSize: '0.9rem' }}
                >
                  {form.cvName || 'Xem CV hiện tại'}
                </a>
              </div>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Chưa có file CV nào được tải lên.</span>
            )}
          </div>
        </div>
      </div>

      <div className="student-profile-actions">
        <button type="submit" className="student-save-btn" disabled={loadingProfile || savingProfile}>
          {savingProfile ? 'Đang lưu...' : hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
        </button>
      </div>
    </form>
  );
}
