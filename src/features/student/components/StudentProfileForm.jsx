import { CareerRoleSelect } from './CareerRoleSelect';

export function StudentProfileForm({
  initials,
  avatarSrc,
  form,
  careerRoles,
  loadingProfile,
  savingProfile,
  uploadingAvatar,
  hasProfile,
  onChange,
  onAvatarFileChange,
  onAvatarImport,
  onReload,
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
          <p>Tải ảnh trực tiếp hoặc import từ URL, sau đó lưu lại cùng hồ sơ nếu backend trả về `avatarUrl` mới.</p>
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
          <div className="student-avatar-import">
            <input
              name="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={onChange}
              placeholder="https://example.com/avatar.png"
              disabled={loadingProfile || savingProfile || uploadingAvatar}
            />
            <button
              type="button"
              className="secondary-action"
              onClick={onAvatarImport}
              disabled={loadingProfile || savingProfile || uploadingAvatar || !form.avatarUrl.trim()}
            >
              Import URL
            </button>
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

      <div className="student-profile-actions">
        <button type="button" className="secondary-action" onClick={onReload} disabled={loadingProfile || savingProfile}>Tải lại</button>
        <button type="submit" className="student-save-btn" disabled={loadingProfile || savingProfile}>
          {savingProfile ? 'Đang lưu...' : hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
        </button>
      </div>
    </form>
  );
}
