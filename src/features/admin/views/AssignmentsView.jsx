import { useMemo, useState } from 'react';
import { formatDate } from '../../../shared/format';
import {
  KpiRow,
  KpiTile,
  SectionTitle,
  StatusPill,
} from '../components/DashboardPrimitives';

const emptyAssignment = { counselorId: '', studentId: '', note: '' };

export function AssignmentsView({ assignments = [], users = [], onCreate, onDelete }) {
  const [form, setForm] = useState(emptyAssignment);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const counselors = useMemo(
    () => users.filter((user) => user.role === 'AcademicCounselor' && user.isActive),
    [users],
  );
  const students = useMemo(
    () => users.filter((user) => user.role === 'Student' && user.isActive),
    [users],
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return assignments;
    return assignments.filter((item) => item.status === statusFilter);
  }, [assignments, statusFilter]);

  const activeCount = assignments.filter((a) => a.status === 'Active').length;
  const inactiveCount = assignments.length - activeCount;
  const distinctCounselors = new Set(
    assignments.filter((a) => a.status === 'Active').map((a) => a.counselorId),
  ).size;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function reset() {
    setForm(emptyAssignment);
    setShowForm(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.counselorId || !form.studentId) return;
    setSaving(true);
    try {
      await onCreate({
        counselorId: form.counselorId,
        studentId: form.studentId,
        note: form.note.trim() || null,
      });
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Mentorship"
        title="Counselor assignments"
        subtitle={`${assignments.length} total · ${activeCount} active`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            New assignment
          </button>
        }
      />

      <KpiRow>
        <KpiTile label="Active" value={activeCount} tone="active" sub="currently paired" />
        <KpiTile label="Inactive" value={inactiveCount} tone="muted" sub="ended pairings" />
        <KpiTile label="Counselors engaged" value={distinctCounselors} sub={`${counselors.length} on staff`} />
        <KpiTile label="Students assigned" value={new Set(assignments.filter((a) => a.status === 'Active').map((a) => a.studentId)).size} sub={`${students.length} active students`} />
      </KpiRow>

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>New assignment</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Close form">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Counselor</span>
                <select name="counselorId" value={form.counselorId} onChange={updateField} required>
                  <option value="">Select counselor</option>
                  {counselors.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Student</span>
                <select name="studentId" value={form.studentId} onChange={updateField} required>
                  <option value="">Select student</option>
                  {students.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Note</span>
              <textarea name="note" value={form.note} onChange={updateField} rows={3} placeholder="Optional context for the pairing." />
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Create assignment'}
              </button>
              <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-wrap">
        <header className="data-table-toolbar">
          <h3>
            Pairings
            <span className="count-badge">{filtered.length} shown</span>
          </h3>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status">
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </header>

        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Counselor</th>
                <th>Student</th>
                <th>Assigned by</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.counselorName}</strong>
                    <span>{item.counselorEmail}</span>
                  </td>
                  <td>
                    <strong>{item.studentName}</strong>
                    <span>{item.studentEmail}</span>
                  </td>
                  <td>{item.assignedByAdminName}</td>
                  <td><StatusPill active={item.status === 'Active'} label={item.status} /></td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td className="table-actions">
                    {item.status === 'Active' && (
                      <button type="button" className="btn-secondary danger-action" onClick={() => onDelete(item)}>End</button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6}><p className="empty-state">No assignments match the filter.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
