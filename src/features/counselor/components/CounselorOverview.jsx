import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCounselorStudents, getMyFeedbacks } from '../api/counselorApi';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
}

export function CounselorOverview({ students, feedbacks, loading, onNavigateToStudents, onNavigateToStudent, onNavigateToFeedback }) {
  const totalStudents = students.length;
  
  const thisMonthFeedbacks = feedbacks.filter(f => {
    const d = new Date(f.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '—';
  
  const recentFeedbacks = feedbacks.slice(0, 5);

  if (loading) {
    return (
      <div>
        <div className="counselor-page-header">
          <h1>Đang tải...</h1>
        </div>
        <div className="counselor-loading">
          <div className="counselor-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="counselor-page-header">
        <h1>Tổng quan</h1>
        <p>Chào mừng bạn quay trở lại</p>
      </div>

      <div className="counselor-kpi-grid">
        <div className="counselor-kpi-card">
          <span className="counselor-kpi-card-label">Tổng sinh viên</span>
          <span className="counselor-kpi-card-value">{totalStudents}</span>
          <span className="counselor-kpi-card-caption">Được phân công theo dõi</span>
        </div>
        <div className="counselor-kpi-card">
          <span className="counselor-kpi-card-label">Cần chú ý</span>
          <span className="counselor-kpi-card-value">—</span>
          <span className="counselor-kpi-card-caption">Sinh viên cần review</span>
        </div>
        <div className="counselor-kpi-card">
          <span className="counselor-kpi-card-label">Feedback tháng</span>
          <span className="counselor-kpi-card-value">{thisMonthFeedbacks.length}</span>
          <span className="counselor-kpi-card-caption">Phản hồi đã gửi</span>
        </div>
        <div className="counselor-kpi-card">
          <span className="counselor-kpi-card-label">Đánh giá TB</span>
          <span className="counselor-kpi-card-value">{avgRating}</span>
          <span className="counselor-kpi-card-caption">Trên 5 sao</span>
        </div>
      </div>

      <div className="counselor-panel-grid">
        <div className="counselor-panel">
          <div className="counselor-panel-header">
            <h3>Sinh viên của tôi</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToStudents(); }}>Xem tất cả →</a>
          </div>
          <div className="counselor-panel-content">
            {students.length === 0 ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">👥</div>
                <h3>Chưa có sinh viên</h3>
                <p>Liên hệ admin để được phân công sinh viên</p>
              </div>
            ) : (
              students.slice(0, 5).map(student => (
                <button
                  key={student.id}
                  type="button"
                  className="counselor-student-card"
                  onClick={() => onNavigateToStudent(student.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '12px', textAlign: 'left' }}
                >
                  <div className="counselor-student-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                    {getInitials(student.fullName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', color: '#1d1d1f', fontSize: '14px' }}>{student.fullName}</strong>
                    <small style={{ color: '#7a7a7a', fontSize: '12px' }}>{student.email}</small>
                  </div>
                  <span style={{ color: '#7a7a7a', fontSize: '12px' }}>{formatRelativeTime(student.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="counselor-panel">
          <div className="counselor-panel-header">
            <h3>Feedback gần nhất</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToFeedback(); }}>Xem tất cả →</a>
          </div>
          <div className="counselor-panel-content">
            {recentFeedbacks.length === 0 ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">💬</div>
                <h3>Chưa có feedback</h3>
                <p>Gửi feedback cho sinh viên để bắt đầu</p>
              </div>
            ) : (
              recentFeedbacks.map(fb => (
                <div key={fb.id} style={{ padding: '12px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#1d1d1f', fontSize: '13px' }}>{fb.studentFullName || 'Sinh viên'}</strong>
                    <span style={{ color: '#7a7a7a', fontSize: '11px' }}>{formatRelativeTime(fb.createdAt)}</span>
                  </div>
                  <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                    {'★'.repeat(fb.rating || 0)}{'☆'.repeat(5 - (fb.rating || 0))}
                  </div>
                  <p style={{ margin: '6px 0 0', color: '#7a7a7a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fb.feedbackText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
