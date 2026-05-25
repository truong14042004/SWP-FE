import { CareerRoleSelect } from './CareerRoleSelect';
import { FileText, Upload, UserRound } from 'lucide-react';
import { Button } from '@/components/animate-ui/components/buttons/button';

export function StudentProfileForm({
  initials,
  avatarSrc,
  form,
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
  onViewCv,
  onSubmit,
  hasPendingAvatar = false,
  onCancelPendingAvatar,
  pendingCvName = '',
  onCancelPendingCv,
}) {
  const hasPendingCv = Boolean(pendingCvName);
  return (
    <form className="student-profile-card plan-form anim-stagger anim-hover-lift" onSubmit={onSubmit}>
      <div className="student-profile-hero">
        <div className="student-profile-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Student avatar" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="student-profile-hero-copy">
          <span className="student-profile-kicker">Hồ sơ sinh viên</span>
          <h2>Ảnh đại diện</h2>
          <p>Cập nhật ảnh, thông tin học vấn và mục tiêu để hệ thống đề xuất roadmap chính xác hơn.</p>
          <div className="student-avatar-controls">
            <Button asChild tapScale={0.96} hoverScale={1.04}>
              <label className="secondary-action student-avatar-upload" style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onAvatarFileChange}
                  disabled={loadingProfile || savingProfile || uploadingAvatar}
                  style={{ display: 'none' }}
                />
                <UserRound size={18} aria-hidden="true" />
                {uploadingAvatar
                  ? 'Đang tải ảnh...'
                  : hasPendingAvatar
                    ? 'Đổi ảnh khác'
                    : 'Chọn ảnh'}
              </label>
            </Button>
            {hasPendingAvatar && (
              <button
                type="button"
                className="secondary-action student-avatar-cancel"
                onClick={onCancelPendingAvatar}
                disabled={savingProfile || uploadingAvatar}
              >
                Huỷ ảnh đã chọn
              </button>
            )}
          </div>
          {hasPendingAvatar && (
            <p className="student-avatar-pending-note">
              Ảnh mới đã sẵn sàng — bấm <strong>{hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ'}</strong> để áp dụng.
            </p>
          )}
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
        <div className="student-cv-panel">
          <p>
            Tải lên CV của bạn dưới dạng file PDF (tối đa 10MB) để hệ thống và AI Mentor có thêm thông tin định hướng.
          </p>
          <div className="student-cv-actions">
            <Button asChild tapScale={0.96} hoverScale={1.04} disabled={loadingProfile || savingProfile || uploadingCv}>
              <label
                className="secondary-action student-avatar-upload student-cv-upload"
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onCvFileChange}
                  disabled={loadingProfile || savingProfile || uploadingCv}
                  style={{ display: 'none' }}
                />
                <Upload size={18} aria-hidden="true" />
                {uploadingCv
                  ? 'Đang tải CV...'
                  : hasPendingCv
                    ? 'Đổi CV khác'
                    : 'Tải CV mới (PDF)'}
              </label>
            </Button>
            {hasPendingCv ? (
              <div className="student-cv-file student-cv-file-pending">
                <FileText size={19} aria-hidden="true" />
                <span>{pendingCvName}</span>
                <button
                  type="button"
                  className="student-cv-cancel"
                  onClick={onCancelPendingCv}
                  disabled={savingProfile || uploadingCv}
                >
                  Huỷ
                </button>
              </div>
            ) : form.cvUrl ? (
              <div className="student-cv-file">
                <FileText size={19} aria-hidden="true" />
                <a href="#" onClick={onViewCv}>
                  {form.cvName || 'Xem CV hiện tại'}
                </a>
              </div>
            ) : (
              <span className="student-cv-empty">Chưa có file CV nào được tải lên.</span>
            )}
          </div>
          {hasPendingCv && (
            <p className="student-avatar-pending-note">
              CV đã sẵn sàng — bấm <strong>{hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ'}</strong> để tải lên.
            </p>
          )}
        </div>
      </div>

      <div className="student-profile-actions">
        <Button type="submit" className="student-save-btn" disabled={loadingProfile || savingProfile} tapScale={0.96} hoverScale={1.04}>
          {savingProfile ? 'Đang lưu...' : hasProfile ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
        </Button>
      </div>
    </form>
  );
}
