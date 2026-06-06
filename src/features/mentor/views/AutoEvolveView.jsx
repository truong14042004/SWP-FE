import React, { useState, useEffect } from 'react';
import { getCareerRoles, getPendingProposals, generateProposals, approveProposal, rejectProposal } from '../api/industryMentorApi';
import { SectionTitle } from '../../admin/components/DashboardPrimitives';

export function AutoEvolveView({ session }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [session]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [rolesRes, proposalsRes] = await Promise.all([
        getCareerRoles(),
        getPendingProposals(session)
      ]);
      setRoles(rolesRes);
      setProposals(proposalsRes);
      if (rolesRes.length > 0) setSelectedRole(rolesRes[0].id);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedRole) return;
    setGenerating(true);
    setError(null);
    try {
      await generateProposals(session, selectedRole);
      // Reload proposals sau khi sinh xong
      const res = await getPendingProposals(session);
      setProposals(res);
      alert('Đã sinh đề xuất thành công!');
    } catch (err) {
      setError(err.message || 'Lỗi khi sinh đề xuất.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt đề xuất này? Yêu cầu kỹ năng sẽ được cập nhật.')) return;
    try {
      await approveProposal(session, id);
      setProposals(current => current.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || 'Lỗi khi duyệt.');
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Từ chối đề xuất này?')) return;
    try {
      await rejectProposal(session, id);
      setProposals(current => current.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || 'Lỗi khi từ chối.');
    }
  }

  const formatAction = (actionType) => {
    switch (actionType) {
      case 'UpdatePriority': return <span className="badge warning">Sửa Priority</span>;
      case 'UpdateWeight': return <span className="badge warning">Sửa Trọng số</span>;
      case 'AddSkill': return <span className="badge success">Thêm Kỹ năng</span>;
      default: return <span>{actionType}</span>;
    }
  };

  const formatChange = (p) => {
    if (p.actionType === 'UpdatePriority') {
      return `Priority: ${p.currentPriority ?? 'N/A'} ➡️ ${p.proposedPriority}`;
    }
    if (p.actionType === 'UpdateWeight') {
      return `Weight: ${p.currentWeight ?? 'N/A'} ➡️ ${p.proposedWeight}`;
    }
    if (p.actionType === 'AddSkill') {
      return `Thêm vào lộ trình (Priority: ${p.proposedPriority}, Weight: ${p.proposedWeight})`;
    }
    return '';
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="AI Auto-Evolve"
        title="Auto-Evolve Roadmap"
        subtitle={`${proposals.length} đề xuất chờ duyệt`}
      />

      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <header className="form-card-header">
          <h3>Phân tích dữ liệu & Sinh đề xuất</h3>
        </header>
        <div className="field-stack" style={{ padding: '1rem' }}>
          <div className="field-row">
            <label>
              <span>Định hướng nghề nghiệp</span>
              <select 
                value={selectedRole} 
                onChange={e => setSelectedRole(e.target.value)}
                disabled={generating}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="button-row">
            <button 
              type="button" 
              className="pill-button" 
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'AI đang phân tích...' : 'Phân tích & Sinh Đề xuất'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="data-table-wrap">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Định hướng</th>
                <th>Kỹ năng</th>
                <th>Loại</th>
                <th>Thay đổi đề xuất</th>
                <th>Lý do từ AI</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(p => (
                <tr key={p.id}>
                  <td>{p.careerRoleName}</td>
                  <td><b>{p.skillName}</b></td>
                  <td>{formatAction(p.actionType)}</td>
                  <td>{formatChange(p)}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontStyle: 'italic' }}>
                    {p.reason}
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn-secondary" onClick={() => handleApprove(p.id)} style={{ color: 'var(--semantic-success)' }}>Duyệt</button>
                    <button type="button" className="btn-secondary danger-action" onClick={() => handleReject(p.id)}>Hủy</button>
                  </td>
                </tr>
              ))}
              {proposals.length === 0 && (
                <tr><td colSpan={6}><p className="empty-state">Không có đề xuất nào đang chờ duyệt.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
