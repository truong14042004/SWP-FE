import { useMemo, useState } from 'react';
import { apiUrl } from '../../../config';
import { formatDate } from '../../../shared/format';
import { SectionHeader, StatusPill } from '../components/DashboardPrimitives';

const roles = ['Student', 'Admin', 'AcademicCounselor', 'IndustryMentor'];

const ROLE_LABELS = {
  Student: 'Student',
  Admin: 'Admin',
  AcademicCounselor: 'Counselor',
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
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const roleMatch = roleFilter === 'All' || user.role === roleFilter;
    const statusMatch = statusFilter === 'All'
      || (statusFilter === 'Active' ? user.isActive : !user.isActive);
    return roleMatch && statusMatch;
  }), [users, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;

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
      {/* Stats row */}
      <div className="metric-grid compact">
        <div className="metric-card">
          <span className="metric-label">Total users</span>
          <strong className="metric-value">{users.length}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Active</span>
          <strong className="metric-value" style={{ color: '#17a34a' }}>{activeCount}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Inactive</span>
          <strong className="metric-value" style={{ color: '#dc2626' }}>{inactiveCount}</strong>
        </div>
        <div className="metric-card" style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="pill-button"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + New user
          </button>
        </div>
      </div>

      {/* Inline form — slides in when needed */}
      {showForm && (
        <div className="panel form-panel">
          <div className="form-panel-header">
            <h3>{editingId ? 'Edit user' : 'Create new user'}</h3>
            <button type="button" className="icon-close" onClick={resetForm} aria-label="Close">✕</button>
          </div>
          <form className="user-inline-form" onSubmit={submitUser}>
            <div className="avatar-editor">
              <AvatarPreview user={{ id: editingId, avatarUrl: form.avatarUrl, fullName: form.fullName, updatedAt: selectedUser?.updatedAt }} />
              <label>
                <span>Avatar</span>
                <input name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={updateField} />
                <small>{form.avatarFile ? form.avatarFile.name : 'JPG, PNG, WebP, GIF — max 5 MB'}</small>
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span>Full name</span>
                <input name="fullName" value={form.fullName} onChange={updateField} required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={updateField} required />
              </label>
              <label>
                <span>Username</span>
                <input name="username" value={form.username} onChange={updateField} required />
              </label>
              <label>
                <span>{editingId ? 'New password' : 'Password'}</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  required={!editingId}
                  placeholder={editingId ? 'Leave empty to keep current' : ''}
                />
              </label>
              <label>
                <span>Role</span>
                <select name="role" value={form.role} onChange={updateField}>
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
            </div>

            <div className="form-grid switches-grid">
              <label className="check-row">
                <input type="checkbox" name="isEmailVerified" checked={form.isEmailVerified} onChange={updateField} />
                <span>Email verified</span>
              </label>
              <label className="check-row">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
                <span>Active account</span>
              </label>
            </div>

            <div className="button-row">
              <button className="primary-action" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create user'}
              </button>
              <button type="button" className="secondary-action" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="panel">
        <div className="user-list-toolbar">
          <div>
            <h3>Accounts</h3>
            <span className="count-badge">{filteredUsers.length} shown</span>
          </div>
          <div className="filter-controls">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter role">
              <option value="All">All roles</option>
              {roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status">
              <option value="All">All status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
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
                  <td><span className="role-chip">{ROLE_LABELS[user.role] || user.role}</span></td>
                  <td className="text-muted">{user.email}</td>
                  <td><StatusPill active={user.isActive} /></td>
                  <td className="text-muted">{formatDate(user.createdAt)}</td>
                  <td className="table-actions">
                    <button type="button" onClick={() => editUser(user)}>Edit</button>
                    <button type="button" onClick={() => onToggleStatus(user)}>
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="danger-action" onClick={() => onDeleteUser(user)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan="6"><span className="empty-text">No users match the current filters.</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AvatarPreview({ user }) {
  const avatarSrc = getAvatarSrc(user);
  const initials = getInitials(user?.fullName);

  if (!avatarSrc) {
    return <span className="avatar-preview fallback">{initials}</span>;
  }

  return (
    <img
      className="avatar-preview"
      src={avatarSrc}
      alt={user?.fullName ? `${user.fullName} avatar` : 'User avatar'}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}

function getAvatarSrc(user) {
  if (!user?.avatarUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(user.avatarUrl)) {
    return user.avatarUrl;
  }

  if (!user.id || !apiUrl) {
    return '';
  }

  const version = user.updatedAt ? `?v=${encodeURIComponent(user.updatedAt)}` : '';
  return `${apiUrl}/api/storage/public/users/${user.id}/avatar/download${version}`;
}

function getInitials(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'U';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}
