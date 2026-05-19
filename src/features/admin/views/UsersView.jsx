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

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const roleMatch = roleFilter === 'All' || user.role === roleFilter;
        const statusMatch =
          statusFilter === 'All' ||
          (statusFilter === 'Active' ? user.isActive : !user.isActive);
        return roleMatch && statusMatch;
      }),
    [users, roleFilter, statusFilter],
  );

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
        eyebrow="People"
        title="Users"
        subtitle="Accounts, roles, and access"
        action={
          <button
            type="button"
            className="pill-button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            New user
          </button>
        }
      />

      <KpiRow>
        <KpiTile label="Total" value={users.length} sub="all accounts" />
        <KpiTile label="Active" value={activeCount} tone="active" sub={`${Math.round((activeCount / Math.max(users.length, 1)) * 100)}% of total`} />
        <KpiTile label="Inactive" value={inactiveCount} tone="muted" sub="includes soft-deleted" />
        <KpiTile label="Email verified" value={verifiedCount} sub={`${users.length - verifiedCount} unverified`} />
      </KpiRow>

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>{editingId ? 'Edit user' : 'Create new user'}</h3>
            <button type="button" className="icon-close" onClick={resetForm} aria-label="Close form">
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
                <span>Avatar</span>
                <input
                  name="avatarFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={updateField}
                />
                <small>{form.avatarFile ? form.avatarFile.name : 'JPG, PNG, WebP, GIF — max 5 MB'}</small>
              </label>
            </div>

            <div className="field-row">
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
                  <span>Email verified</span>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={updateField}
                  />
                  <span>Active account</span>
                </label>
              </div>
            </div>

            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create user'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-wrap">
        <header className="data-table-toolbar">
          <h3>
            Accounts
            <span className="count-badge">{filteredUsers.length} shown</span>
          </h3>
          <div className="filter-row">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter role">
              <option value="All">All roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] || role}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status">
              <option value="All">All status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </header>

        <div className="scroll-x">
          <table className="data-table">
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
                      Edit
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => onToggleStatus(user)}>
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => onDeleteUser(user)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={6}>
                    <p className="empty-state">No users match the current filters.</p>
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
      alt={user?.fullName ? `${user.fullName} avatar` : 'User avatar'}
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
