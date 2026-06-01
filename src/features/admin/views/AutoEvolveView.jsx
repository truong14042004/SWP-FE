import React, { useState, useEffect } from 'react';
import { getCareerRoles, getPendingProposals, generateProposals, approveProposal, rejectProposal } from '../adminApi';

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
    <div className="card">
      <div className="card-header">
        <h2>Auto-Evolve Roadmap (Đề xuất AI)</h2>
      </div>

      <div className="card-body">
        {error && <div className="alert error">{error}</div>}
        
        <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <select 
            value={selectedRole} 
            onChange={e => setSelectedRole(e.target.value)}
            disabled={generating}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button 
            type="button" 
            className="primary" 
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'AI đang phân tích...' : 'Phân tích Thị trường & Sinh Đề xuất'}
          </button>
        </div>

        <h3>Các đề xuất chờ duyệt ({proposals.length})</h3>
        {proposals.length === 0 ? (
          <p className="text-muted">Không có đề xuất nào đang chờ duyệt.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Định hướng</th>
                  <th>Kỹ năng</th>
                  <th>Loại</th>
                  <th>Thay đổi đề xuất</th>
                  <th>Lý do từ AI</th>
                  <th>Hành động</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="success" onClick={() => handleApprove(p.id)}>Duyệt</button>
                        <button type="button" className="danger" onClick={() => handleReject(p.id)}>Hủy</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
