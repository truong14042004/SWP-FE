import { formatDate } from '../../../shared/format';
import { Panel, SectionHeader, StatusPill } from '../components/DashboardPrimitives';

export function UsersView({ users, selectedUser, onSelectUser, onToggleStatus, onDeleteUser }) {
  return (
    <section className="admin-section">
      <SectionHeader title="User management" subtitle={`${users.length} accounts`} />
      <div className="split-grid wide-left">
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.fullName}</strong><span>{user.username || 'No username'}</span></td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td><StatusPill active={user.isActive} /></td>
                  <td className="table-actions">
                    <button type="button" onClick={() => onSelectUser(user.id)}>Detail</button>
                    <button type="button" onClick={() => onToggleStatus(user)}>{user.isActive ? 'Disable' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Panel title="User detail">
          {selectedUser ? (
            <div className="detail-stack">
              <strong>{selectedUser.fullName}</strong>
              <span>{selectedUser.email}</span>
              <span>Role: {selectedUser.role}</span>
              <span>Email verified: {selectedUser.isEmailVerified ? 'Yes' : 'No'}</span>
              <span>Created: {formatDate(selectedUser.createdAt)}</span>
              <span>Updated: {formatDate(selectedUser.updatedAt)}</span>
              <StatusPill active={selectedUser.isActive} />
              <div className="button-row">
                <button type="button" onClick={() => onToggleStatus(selectedUser)}>
                  {selectedUser.isActive ? 'Disable account' : 'Activate account'}
                </button>
                <button type="button" onClick={() => onDeleteUser(selectedUser)}>
                  Delete user
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-text">Chọn một user để xem chi tiết.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
