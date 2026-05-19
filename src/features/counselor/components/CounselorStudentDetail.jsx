import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getStudentProfile,
  getStudentSkills,
  getStudentSkillGapLatest,
  getStudentSkillGapHistory,
  getStudentRoadmap,
  getStudentFeedbacks,
} from '../api/counselorApi';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

const TABS = [
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'skillgap', label: 'Skill Gap' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'feedback', label: 'Feedback' },
];

export function CounselorStudentDetail({ session, studentId, students, onBack, onOpenFeedbackModal, onRefreshFeedbacks }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillGapLatest, setSkillGapLatest] = useState(null);
  const [skillGapHistory, setSkillGapHistory] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedSkillGapReport, setSelectedSkillGapReport] = useState(null);

  const student = students.find(s => s.id === studentId);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  async function loadStudentData() {
    setLoading(true);
    try {
      const [profileData, skillsData, skillGapData, historyData, roadmapData, feedbacksData] = await Promise.all([
        getStudentProfile(session, studentId).catch(() => null),
        getStudentSkills(session, studentId).catch(() => []),
        getStudentSkillGapLatest(session, studentId).catch(() => null),
        getStudentSkillGapHistory(session, studentId).catch(() => []),
        getStudentRoadmap(session, studentId).catch(() => null),
        getStudentFeedbacks(session, studentId).catch(() => []),
      ]);
      
      setProfile(profileData);
      setSkills(skillsData);
      setSkillGapLatest(skillGapData);
      setSkillGapHistory(historyData);
      setRoadmap(roadmapData);
      setFeedbacks(feedbacksData);
      
      if (skillGapData) {
        setSelectedSkillGapReport(skillGapData);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể tải dữ liệu sinh viên');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <button type="button" className="counselor-back-btn" onClick={onBack}>← Quay lại danh sách</button>
        <div className="counselor-loading" style={{ marginTop: '40px' }}>
          <div className="counselor-spinner" />
          <p>Đang tải dữ liệu sinh viên...</p>
        </div>
      </div>
    );
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`counselor-feedback-star ${i < (rating || 0) ? '' : 'empty'}`}>★</span>
    ));
  };

  return (
    <div>
      <button type="button" className="counselor-back-btn" onClick={onBack}>← Quay lại danh sách</button>

      <div className="counselor-student-hero">
        <div className="counselor-student-hero-avatar">
          {getInitials(student?.fullName || 'S')}
        </div>
        <div className="counselor-student-hero-info">
          <h2>{student?.fullName || 'Sinh viên'}</h2>
          <p>{student?.email}</p>
          {profile?.profile && (
            <div className="counselor-student-hero-tags">
              {profile.profile.school && <span className="counselor-tag">📚 {profile.profile.school}</span>}
              {profile.profile.major && <span className="counselor-tag">🎓 {profile.profile.major}</span>}
              {profile.profile.targetRoleName && <span className="counselor-tag">🎯 {profile.profile.targetRoleName}</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          className="counselor-btn counselor-btn-primary"
          onClick={() => onOpenFeedbackModal(student)}
          style={{ marginLeft: 'auto' }}
        >
          Viết feedback
        </button>
      </div>

      <div className="counselor-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`counselor-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="counselor-tab-content">
        {activeTab === 'profile' && (
          <div>
            {profile?.profile ? (
              <div className="counselor-profile-grid">
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">Trường học</span>
                  <span className="counselor-profile-value">{profile.profile.school || '—'}</span>
                </div>
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">Chuyên ngành</span>
                  <span className="counselor-profile-value">{profile.profile.major || '—'}</span>
                </div>
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">Năm học</span>
                  <span className="counselor-profile-value">{profile.profile.year || '—'}</span>
                </div>
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">GPA</span>
                  <span className="counselor-profile-value">{profile.profile.gpa || '—'}</span>
                </div>
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">Mục tiêu nghề nghiệp</span>
                  <span className="counselor-profile-value">{profile.profile.targetRoleName || '—'}</span>
                </div>
                <div className="counselor-profile-item">
                  <span className="counselor-profile-label">Giờ học/tuần</span>
                  <span className="counselor-profile-value">{profile.profile.preferredLearningHoursPerWeek || '—'} giờ</span>
                </div>
                {profile.profile.careerGoal && (
                  <div className="counselor-profile-item full-width">
                    <span className="counselor-profile-label">Mục tiêu ngắn hạn / dài hạn</span>
                    <span className="counselor-profile-value">{profile.profile.careerGoal}</span>
                  </div>
                )}
                {profile.profile.githubUsername && (
                  <div className="counselor-profile-item full-width">
                    <span className="counselor-profile-label">GitHub</span>
                    <span className="counselor-profile-value">
                      <a href={`https://github.com/${profile.profile.githubUsername}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2' }}>
                        @{profile.profile.githubUsername}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">📋</div>
                <h3>Chưa có hồ sơ</h3>
                <p>Sinh viên chưa cập nhật thông tin hồ sơ</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            {skills.length === 0 ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">💻</div>
                <h3>Chưa có kỹ năng</h3>
                <p>Sinh viên chưa khai báo kỹ năng</p>
              </div>
            ) : (
              <div>
                <p style={{ color: '#7a7a7a', fontSize: '14px', marginBottom: '20px' }}>
                  {skills.length} kỹ năng · {skills.filter(s => s.isVerified).length} đã verify
                </p>
                {Object.entries(
                  skills.reduce((acc, skill) => {
                    const cat = skill.skillCategory || 'Khác';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill);
                    return acc;
                  }, {})
                ).map(([category, categorySkills]) => (
                  <div key={category} className="counselor-skill-category">
                    <div className="counselor-skill-category-header">
                      <h4>{category}</h4>
                      <span>{categorySkills.length} skills</span>
                    </div>
                    {categorySkills.map(skill => (
                      <div key={skill.id} className="counselor-skill-row">
                        <div className={`counselor-skill-icon ${skill.isVerified ? 'verified' : 'unverified'}`}>
                          {skill.isVerified ? '✓' : '⚠'}
                        </div>
                        <span className="counselor-skill-name">{skill.skillName}</span>
                        <span className={`counselor-skill-level ${skill.level?.toLowerCase()}`}>
                          {skill.level}
                        </span>
                        {skill.verifiedByFullName && (
                          <span style={{ color: '#7a7a7a', fontSize: '12px' }}>
                            Verify by {skill.verifiedByFullName}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skillgap' && (
          <div>
            {!skillGapLatest && skillGapHistory.length === 0 ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">📊</div>
                <h3>Chưa có báo cáo Skill Gap</h3>
                <p>Sinh viên chưa chạy phân tích skill gap</p>
              </div>
            ) : (
              <div>
                {selectedSkillGapReport && (
                  <div className="counselor-skill-gap-overview">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className="counselor-skill-gap-ring" style={{
                        background: `conic-gradient(#0891b2 0deg, #06b6d4 ${selectedSkillGapReport.matchScore * 3.6}deg, #e0e0e0 ${selectedSkillGapReport.matchScore * 3.6}deg)`
                      }}>
                        <div className="counselor-skill-gap-ring-inner">
                          <div>
                            <div className="counselor-skill-gap-ring-value">{Math.round(selectedSkillGapReport.matchScore)}%</div>
                            <div className="counselor-skill-gap-ring-label">Match</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="counselor-skill-gap-summary">
                      <h3>{selectedSkillGapReport.careerRoleName}</h3>
                      <p>{selectedSkillGapReport.summary || 'Không có tổng kết'}</p>
                      <div className="counselor-skill-gap-stats">
                        {selectedSkillGapReport.items && (
                          <>
                            <span className="counselor-skill-gap-stat missing">
                              {selectedSkillGapReport.items.filter(i => i.status?.toLowerCase() === 'missing' || i.status?.toLowerCase() === 'gap').length} Thiếu
                            </span>
                            <span className="counselor-skill-gap-stat weak">
                              {selectedSkillGapReport.items.filter(i => i.status?.toLowerCase() === 'weak').length} Yếu
                            </span>
                            <span className="counselor-skill-gap-stat achieved">
                              {selectedSkillGapReport.items.filter(i => i.status?.toLowerCase() === 'met' || i.status?.toLowerCase() === 'achieved').length} Đạt
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedSkillGapReport?.items && selectedSkillGapReport.items.length > 0 && (
                  <div className="counselor-skill-gap-list">
                    <h4 style={{ marginBottom: '12px', color: '#1d1d1f' }}>Kỹ năng cần ưu tiên</h4>
                    {selectedSkillGapReport.items.map((item, index) => (
                      <div key={item.skillId} className={`counselor-skill-gap-item ${item.status?.toLowerCase() === 'met' || item.status?.toLowerCase() === 'achieved' ? 'achieved' : item.status?.toLowerCase() === 'weak' ? 'weak' : 'missing'}`}>
                        <div className="counselor-skill-gap-item-priority">{index + 1}</div>
                        <div className="counselor-skill-gap-item-info">
                          <div className="counselor-skill-gap-item-name">{item.skillName}</div>
                          <div className="counselor-skill-gap-item-levels">
                            Hiện tại: <strong>{item.currentLevel || '—'}</strong>
                            {' → '}
                            Yêu cầu: <strong>{item.requiredLevel}</strong>
                          </div>
                          {item.recommendation && (
                            <div className="counselor-skill-gap-item-recommendation">{item.recommendation}</div>
                          )}
                        </div>
                        <span className={`counselor-skill-gap-status ${item.status?.toLowerCase() === 'met' || item.status?.toLowerCase() === 'achieved' ? 'achieved' : item.status?.toLowerCase() === 'weak' ? 'weak' : 'missing'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {skillGapHistory.length > 1 && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                    <h4 style={{ marginBottom: '12px', color: '#1d1d1f' }}>Lịch sử báo cáo</h4>
                    {skillGapHistory.map(report => (
                      <div
                        key={report.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: selectedSkillGapReport?.id === report.id ? '#ecfeff' : '#f5f5f7',
                          borderRadius: '10px',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedSkillGapReport(report)}
                      >
                        <div>
                          <span style={{ color: '#1d1d1f', fontSize: '13px' }}>
                            {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span style={{ color: '#7a7a7a', fontSize: '12px', marginLeft: '12px' }}>
                            {Math.round(report.matchScore)}% · {report.careerRoleName}
                          </span>
                        </div>
                        <span style={{ color: '#0891b2', fontSize: '12px' }}>Xem</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div>
            {!roadmap ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">🧭</div>
                <h3>Chưa có Roadmap</h3>
                <p>Sinh viên chưa tạo lộ trình học tập</p>
              </div>
            ) : (
              <div>
                <div className="counselor-roadmap-header">
                  <h3>{roadmap.title || 'Lộ trình cá nhân'}</h3>
                  <p style={{ color: '#7a7a7a', fontSize: '13px' }}>
                    {roadmap.status} · {roadmap.progress || 0}% hoàn thành
                  </p>
                </div>

                <div className="counselor-roadmap-progress">
                  <div className="counselor-roadmap-progress-bar">
                    <span style={{ width: `${roadmap.progress || 0}%` }} />
                  </div>
                  <div className="counselor-roadmap-progress-text">
                    <span>Tiến độ</span>
                    <span>{roadmap.progress || 0}%</span>
                  </div>
                </div>

                {roadmap.nodes && roadmap.nodes.length > 0 && (
                  <div>
                    {roadmap.nodes.filter(n => n.nodeType === 'Group' || n.level === 0).map(group => (
                      <div key={group.id} className="counselor-roadmap-group">
                        <div className="counselor-roadmap-group-header">
                          <h4>{group.title}</h4>
                        </div>
                        {roadmap.nodes
                          .filter(n => n.parentNodeId === group.id)
                          .map(node => (
                            <div key={node.id} className="counselor-roadmap-node">
                              <div className={`counselor-roadmap-node-status ${node.status?.toLowerCase().replace(' ', '-')}`}>
                                {node.status === 'Completed' ? '✓' : node.status === 'InProgress' ? '↻' : '○'}
                              </div>
                              <div className="counselor-roadmap-node-info">
                                <h5>{node.title}</h5>
                                {node.description && <p>{node.description}</p>}
                              </div>
                              <span className={`counselor-roadmap-node-badge ${node.status?.toLowerCase().replace(' ', '-')}`}>
                                {node.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}

                    {roadmap.nodes.filter(n => !n.parentNodeId && n.nodeType !== 'Group' && n.level !== 0).map(node => (
                      <div key={node.id} className="counselor-roadmap-node">
                        <div className={`counselor-roadmap-node-status ${node.status?.toLowerCase().replace(' ', '-')}`}>
                          {node.status === 'Completed' ? '✓' : node.status === 'InProgress' ? '↻' : '○'}
                        </div>
                        <div className="counselor-roadmap-node-info">
                          <h5>{node.title}</h5>
                          {node.description && <p>{node.description}</p>}
                        </div>
                        <span className={`counselor-roadmap-node-badge ${node.status?.toLowerCase().replace(' ', '-')}`}>
                          {node.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1d1d1f' }}>Feedback đã gửi ({feedbacks.length})</h3>
              <button
                type="button"
                className="counselor-btn counselor-btn-primary"
                onClick={() => onOpenFeedbackModal(student)}
              >
                + Mới
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div className="counselor-empty-state">
                <div className="counselor-empty-state-icon">💬</div>
                <h3>Chưa có feedback</h3>
                <p>Gửi feedback đầu tiên cho sinh viên này</p>
              </div>
            ) : (
              <div className="counselor-feedback-list">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="counselor-feedback-item">
                    <div className="counselor-feedback-header">
                      <span className="counselor-feedback-date">
                        {new Date(fb.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      <div className="counselor-feedback-stars">
                        {renderStars(fb.rating)}
                      </div>
                    </div>

                    <div className="counselor-feedback-type">
                      {fb.roadmapId && <span className="counselor-feedback-type-badge">Roadmap</span>}
                      {fb.skillGapReportId && <span className="counselor-feedback-type-badge">Skill Gap</span>}
                      {!fb.roadmapId && !fb.skillGapReportId && <span className="counselor-feedback-type-badge">Tổng quát</span>}
                    </div>

                    <p className="counselor-feedback-text">{fb.feedbackText}</p>

                    {fb.recommendations && (
                      <div className="counselor-feedback-section">
                        <div className="counselor-feedback-section-title">Khuyến nghị</div>
                        <p>{fb.recommendations}</p>
                      </div>
                    )}

                    {fb.privateNotes && (
                      <div className="counselor-feedback-section counselor-feedback-private">
                        <div className="counselor-feedback-section-title">Ghi chú riêng (chỉ bạn thấy)</div>
                        <p>{fb.privateNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
