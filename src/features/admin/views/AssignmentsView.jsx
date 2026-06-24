import { useMemo, useState } from 'react';
import { formatDate } from '../../../shared/format';
import {
  KpiRow,
  KpiTile,
  SectionTitle,
  StatusPill,
} from '../components/DashboardPrimitives';

const emptyAssignment = { counselorId: '', studentId: '', note: '' };

export function AssignmentsView({ assignments = [], users = [], onCreate, onDelete, onEnable }) {
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
        eyebrow="Cố vấn"
        title="Phân công tư vấn viên"
        subtitle={`${assignments.length} tổng · ${activeCount} đang hoạt động`}
        action={
          <button type="button" className="pill-button" onClick={() => { reset(); setShowForm(true); }}>
            Thêm phân công
          </button>
        }
      />

      <KpiRow>
        <KpiTile label="Đang hoạt động" value={activeCount} tone="active" sub="đang được ghép" />
        <KpiTile label="Ngừng hoạt động" value={inactiveCount} tone="muted" sub="đã kết thúc" />
        <KpiTile label="Tư vấn viên đang phụ trách" value={distinctCounselors} sub={`${counselors.length} trong đội ngũ`} />
        <KpiTile label="Học viên được phân công" value={new Set(assignments.filter((a) => a.status === 'Active').map((a) => a.studentId)).size} sub={`${students.length} học viên hoạt động`} />
      </KpiRow>

      {showForm && (
        <div className="form-card">
          <header className="form-card-header">
            <h3>Thêm phân công</h3>
            <button type="button" className="icon-close" onClick={reset} aria-label="Đóng biểu mẫu">✕</button>
          </header>

          <form className="field-stack" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Tư vấn viên</span>
                <select name="counselorId" value={form.counselorId} onChange={updateField} required>
                  <option value="">Chọn tư vấn viên</option>
                  {counselors.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Học viên</span>
                <select name="studentId" value={form.studentId} onChange={updateField} required>
                  <option value="">Chọn học viên</option>
                  {students.map((user) => (
                    <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Ghi chú</span>
              <textarea name="note" value={form.note} onChange={updateField} rows={3} placeholder="Bối cảnh tùy chọn cho việc ghép cặp." />
            </label>
            <div className="button-row">
              <button className="pill-button" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : 'Tạo phân công'}
              </button>
              <button type="button" className="btn-secondary" onClick={reset}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-table-wrap">
        <header className="data-table-toolbar">
          <h3>
            Ghép cặp
            <span className="count-badge">{filtered.length} hiển thị</span>
          </h3>
          <div className="filter-row">
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
                <th>Tư vấn viên</th>
                <th>Học viên</th>
                <th>Người phân công</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
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
                      <button
                        type="button"
                        className="btn-secondary danger-action"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn kết thúc phân công giữa "${item.counselorName}" và "${item.studentName}"?`)) {
                            onDelete(item);
                          }
                        }}
                      >
                        Kết thúc
                      </button>
                    )}
                    {item.status === 'Inactive' && onEnable && (
                      <button type="button" className="btn-secondary" onClick={() => onEnable(item)}>Kích hoạt</button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6}><p className="empty-state">Không có phân công nào khớp bộ lọc.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
