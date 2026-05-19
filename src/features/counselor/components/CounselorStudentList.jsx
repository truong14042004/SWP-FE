import { useState } from 'react';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
}

export function CounselorStudentList({ students, loading, onSelectStudent, onOpenFeedbackModal, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'new') {
      const createdDate = new Date(student.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && createdDate > weekAgo;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div>
        <div className="counselor-page-header">
          <h1>Sinh viên của tôi</h1>
        </div>
        <div className="counselor-loading">
          <div className="counselor-spinner" />
          <p>Đang tải danh sách sinh viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="counselor-page-header">
        <h1>Sinh viên của tôi</h1>
        <p>{students.length} sinh viên được phân công</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7a7a7a' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm sinh viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '1px solid #e0e0e0',
              borderRadius: '999px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`counselor-btn ${filter === 'all' ? 'counselor-btn-primary' : 'counselor-btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`counselor-btn ${filter === 'new' ? 'counselor-btn-primary' : 'counselor-btn-secondary'}`}
            onClick={() => setFilter('new')}
          >
            Mới
          </button>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="counselor-empty-state">
          <div className="counselor-empty-state-icon">👥</div>
          <h3>Không tìm thấy sinh viên</h3>
          <p>{searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bạn chưa được phân công sinh viên nào'}</p>
        </div>
      ) : (
        <div className="counselor-student-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="counselor-student-card">
              <div className="counselor-student-card-header">
                <div className="counselor-student-avatar">
                  {getInitials(student.fullName)}
                </div>
                <div className="counselor-student-info">
                  <h4>{student.fullName}</h4>
                  <span>{student.email}</span>
                </div>
              </div>
              
              <div className="counselor-student-meta">
                <div className="counselor-student-meta-row">
                  <span>Tài khoản</span>
                  <strong>@{student.username || '—'}</strong>
                </div>
                <div className="counselor-student-meta-row">
                  <span>Cập nhật</span>
                  <span>{formatRelativeTime(student.createdAt)}</span>
                </div>
              </div>
              
              <div className="counselor-student-actions">
                <button
                  type="button"
                  className="counselor-btn counselor-btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFeedbackModal(student);
                  }}
                >
                  Feedback
                </button>
                <button
                  type="button"
                  className="counselor-btn counselor-btn-primary"
                  onClick={() => onSelectStudent(student.id)}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
