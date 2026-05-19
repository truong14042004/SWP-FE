import { useState } from 'react';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function CounselorFeedbackHistory({ feedbacks, students, onSelectStudent, onRefresh }) {
  const [filterStudent, setFilterStudent] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.fullName || 'Sinh viên';
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (!filterStudent) return true;
    const studentName = getStudentName(fb.studentId);
    return studentName.toLowerCase().includes(filterStudent.toLowerCase());
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`counselor-feedback-star ${i < (rating || 0) ? '' : 'empty'}`}>★</span>
    ));
  };

  const getFeedbackTypeBadge = (fb) => {
    const types = [];
    if (fb.roadmapId) types.push('R');
    if (fb.skillGapReportId) types.push('SG');
    if (types.length === 0) return null;
    return types.join('+');
  };

  if (feedbacks.length === 0) {
    return (
      <div>
        <div className="counselor-page-header">
          <h1>Lịch sử Feedback</h1>
          <p>0 feedback đã gửi</p>
        </div>
        <div className="counselor-empty-state">
          <div className="counselor-empty-state-icon">💬</div>
          <h3>Chưa có feedback nào</h3>
          <p>Gửi feedback cho sinh viên để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="counselor-page-header">
        <h1>Lịch sử Feedback</h1>
        <p>{feedbacks.length} feedback đã gửi</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Lọc theo sinh viên..."
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '300px',
            padding: '10px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      <div className="counselor-tab-content" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="counselor-feedback-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Sinh viên</th>
              <th>Rating</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.map(fb => (
              <>
                <tr key={fb.id} onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)} style={{ cursor: 'pointer' }}>
                  <td>{formatDate(fb.createdAt)}</td>
                  <td>
                    <div className="student-cell">
                      <div className="student-avatar">{getInitials(getStudentName(fb.studentId))}</div>
                      <span>{getStudentName(fb.studentId)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="counselor-feedback-stars" style={{ display: 'flex' }}>
                      {renderStars(fb.rating)}
                    </div>
                  </td>
                  <td>
                    <div className="counselor-feedback-type-cell">
                      {getFeedbackTypeBadge(fb) && (
                        <span className="counselor-feedback-type-badge">{getFeedbackTypeBadge(fb)}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fb.feedbackText}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="counselor-btn counselor-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(fb.studentId);
                      }}
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      Xem SV
                    </button>
                  </td>
                </tr>
                {expandedId === fb.id && (
                  <tr key={`${fb.id}-expanded`}>
                    <td colSpan="6" style={{ background: '#f9f9f9', padding: '20px' }}>
                      <div style={{ marginBottom: fb.recommendations ? '16px' : 0 }}>
                        <strong style={{ color: '#1d1d1f', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Nội dung feedback:</strong>
                        <p style={{ margin: 0, color: '#333', fontSize: '14px', lineHeight: '1.6' }}>{fb.feedbackText}</p>
                      </div>
                      {fb.recommendations && (
                        <div style={{ marginBottom: fb.privateNotes ? '16px' : 0 }}>
                          <strong style={{ color: '#1d1d1f', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Khuyến nghị:</strong>
                          <p style={{ margin: 0, color: '#333', fontSize: '14px', lineHeight: '1.6' }}>{fb.recommendations}</p>
                        </div>
                      )}
                      {fb.privateNotes && (
                        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px' }}>
                          <strong style={{ color: '#92400e', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Ghi chú riêng (chỉ bạn thấy):</strong>
                          <p style={{ margin: 0, color: '#78350f', fontSize: '13px', lineHeight: '1.5' }}>{fb.privateNotes}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
