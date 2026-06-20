import { useMemo, useState } from 'react';
import { apiUrl } from '../../../config';
import { formatDate } from '../../../shared/format';
import {
  KpiRow,
  KpiTile,
  SectionTitle,
  StatusPill,
} from '../components/DashboardPrimitives';

const ROLES = ['Student', 'Admin', 'AcademicCounselor', 'IndustryMentor'];

const ROLE_LABELS = {
  Student: 'Học viên',
  Admin: 'Quản trị viên',
  AcademicCounselor: 'Tư vấn viên',
  IndustryMentor: 'Mentor',
};

const emptyUserForm = {
  username: '',
  email: '',
  fullName: '',
  role: 'Student',
  avatarUrl: '',
  avatarFile: null,
  password: '',
  isEmailVerified: true,
  isActive: true,
};

export function UsersView({
  users,
  selectedUser,
  onSelectUser,
  onSaveUser,
  onUploadAvatar,
  onToggleStatus,
  onDeleteUser,
}) {
  const [form, setForm] = useState(emptyUserForm);
  const [editingId, setEditingId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatch = roleFilter === 'All' || user.role === roleFilter;
      const statusMatch =
        statusFilter === 'All' ||
        (statusFilter === 'Active' ? user.isActive : !user.isActive);
      if (!roleMatch || !statusMatch) return false;

      if (!q) return true;
      return (
        user.fullName?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const verifiedCount = users.filter((user) => user.isEmailVerified).length;

  function updateField(event) {
    const { name, value, type, checked, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] || null : value,
    }));
  }

  async function editUser(user) {
    const latest = await onSelectUser(user.id);
    const userForForm = latest || user;
    setEditingId(userForForm.id);
    setForm({
      username: userForForm.username || '',
      email: userForForm.email || '',
      fullName: userForForm.fullName || '',
      role: userForForm.role || 'Student',
      avatarUrl: userForForm.avatarUrl || '',
      avatarFile: null,
      password: '',
      isEmailVerified: Boolean(userForForm.isEmailVerified),
      isActive: Boolean(userForForm.isActive),
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId('');
    setForm(emptyUserForm);
    setShowForm(false);
  }

  async function submitUser(event) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      username: form.username.trim(),
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      password: form.password.trim(),
    };
    delete payload.avatarFile;

    if (editingId && !payload.password) {
      delete payload.password;
    }

    try {
      const savedUser = await onSaveUser(payload, editingId);
      if (form.avatarFile && savedUser?.id) {
        await onUploadAvatar(savedUser.id, form.avatarFile);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Con người"
        title="Người dùng"
        subtitle="Tài khoản, vai trò và quyền truy cập"
        action={
          <button
            type="button"
            className="pill-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Thêm người dùng
          </button>
        }
      />

      <KpiRow>
        <KpiTile label="Tổng số" value={users.length} sub="tất cả tài khoản" />
        <KpiTile label="Đang hoạt động" value={activeCount} tone="active" sub={`${Math.round((activeCount / Math.max(users.length, 1)) * 100)}% tổng số`} />
        <KpiTile label="Ngừng hoạt động" value={inactiveCount} tone="muted" sub="gồm cả đã xóa mềm" />
        <KpiTile label="Đã xác minh email" value={verifiedCount} sub={`${users.length - verifiedCount} chưa xác minh`} />
      </KpiRow>

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Sửa người dùng' : 'Tạo người dùng mới'}</h3>
            <button type="button" className="icon-close" onClick={resetForm} aria-label="Đóng biểu mẫu">
              ✕
            </button>
          </header>

          <form className="field-stack" onSubmit={submitUser}>
            <div className="avatar-editor">
              <AvatarPreview
                large
                user={{
                  id: editingId,
                  avatarUrl: form.avatarUrl,
                  fullName: form.fullName,
                  updatedAt: selectedUser?.updatedAt,
                }}
              />
              <label>
                <span>Ảnh đại diện</span>
                <input
                  name="avatarFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={updateField}
                />
                <small>{form.avatarFile ? form.avatarFile.name : 'JPG, PNG, WebP, GIF — tối đa 5 MB'}</small>
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Họ và tên</span>
                <input name="fullName" value={form.fullName} onChange={updateField} required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={updateField} required />
              </label>
              <label>
                <span>Tên đăng nhập</span>
                <input name="username" value={form.username} onChange={updateField} required />
              </label>
              <label>
                <span>{editingId ? 'Mật khẩu mới' : 'Mật khẩu'}</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  required={!editingId}
                  placeholder={editingId ? 'Để trống để giữ mật khẩu hiện tại' : ''}
                />
              </label>
              <label>
                <span>Vai trò</span>
                <select name="role" value={form.role} onChange={updateField}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role] || role}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-stack" style={{ alignSelf: 'end' }}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="isEmailVerified"
                    checked={form.isEmailVerified}
                    onChange={updateField}
                  />
                  <span>Email đã xác minh</span>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={updateField}
                  />
                  <span>Tài khoản hoạt động</span>
                </label>
              </div>
            </div>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Tạo người dùng'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-wrap">
        <header className="data-table-toolbar">
          <h3>
            Tài khoản
            <span className="count-badge">{filteredUsers.length} hiển thị</span>
          </h3>
          <div className="filter-row">
            <input
              type="search"
              className="data-table-search"
              placeholder="Tìm theo tên, email, username..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Tìm người dùng"
            />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Lọc theo vai trò">
              <option value="All">Tất cả vai trò</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Lọc theo trạng thái">
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Ngừng</option>
            </select>
          </div>
        </header>

        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <AvatarPreview user={user} />
                      <div>
                        <strong>{user.fullName}</strong>
                        <span>{user.username || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-chip">{ROLE_LABELS[user.role] || user.role}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <StatusPill active={user.isActive} />
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => editUser(user)}>
                      Sửa
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => onToggleStatus(user)}>
                      {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary danger-action"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc muốn xóa tài khoản này?')) {
                          onDeleteUser(user);
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={6}>
                    <p className="empty-state">Không có người dùng nào khớp bộ lọc hiện tại.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AvatarPreview({ user, large }) {
  const avatarSrc = getAvatarSrc(user);
  const initials = getInitials(user?.fullName);
  const className = large ? 'avatar lg' : 'avatar';

  if (!avatarSrc) {
    return <span className={`${className} fallback`}>{initials}</span>;
  }

  return (
    <img
      className={className}
      src={avatarSrc}
      alt={user?.fullName ? `Ảnh đại diện ${user.fullName}` : 'Ảnh đại diện người dùng'}
      onError={(event) => {
        event.currentTarget.replaceWith(
          Object.assign(document.createElement('span'), {
            className: `${className} fallback`,
            innerText: initials,
          }),
        );
      }}
    />
  );
}

function getAvatarSrc(user) {
  if (!user?.avatarUrl) return '';
  if (/^https?:\/\//i.test(user.avatarUrl)) return user.avatarUrl;
  if (!user.id || !apiUrl) return '';
  const version = user.updatedAt ? `?v=${encodeURIComponent(user.updatedAt)}` : '';
  return `${apiUrl}/api/storage/public/users/${user.id}/avatar/download${version}`;
}

function getInitials(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}
