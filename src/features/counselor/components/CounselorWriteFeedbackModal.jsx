import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

const EMPTY_FORM = {
  feedbackText: '',
  rating: 0,
  recommendations: '',
  privateNotes: '',
  roadmapId: null,
  skillGapReportId: null,
  feedbackType: 'general',
};

export function CounselorWriteFeedbackModal({ session, student, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }

  function validate() {
    const newErrors = {};
    
    if (!form.feedbackText.trim()) {
      newErrors.feedbackText = 'Vui lòng nhập nội dung feedback';
    } else if (form.feedbackText.trim().length < 50) {
      newErrors.feedbackText = 'Feedback phải có ít nhất 50 ký tự';
    }
    
    if (form.rating < 1 || form.rating > 5) {
      newErrors.rating = 'Đánh giá phải từ 1 đến 5 sao';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        studentId: student.id,
        feedbackText: form.feedbackText.trim(),
        rating: form.rating || null,
        recommendations: form.recommendations.trim() || null,
        privateNotes: form.privateNotes.trim() || null,
        roadmapId: form.feedbackType === 'roadmap' ? form.roadmapId : null,
        skillGapReportId: form.feedbackType === 'skillgap' ? form.skillGapReportId : null,
      };
      
      const result = await onSubmit(payload);
      if (result.success) {
        toast.success('Đã gửi feedback thành công');
        onClose();
      } else {
        toast.error(result.error || 'Không thể gửi feedback');
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="counselor-modal-overlay" onClick={handleOverlayClick}>
      <div className="counselor-modal">
        <div className="counselor-modal-header">
          <h3>Viết feedback</h3>
          <button type="button" className="counselor-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="counselor-modal-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '14px', background: '#f5f5f7', borderRadius: '12px' }}>
              <div className="counselor-student-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                {getInitials(student.fullName)}
              </div>
              <div>
                <strong style={{ color: '#1d1d1f', fontSize: '14px' }}>{student.fullName}</strong>
                <p style={{ margin: '2px 0 0', color: '#7a7a7a', fontSize: '12px' }}>{student.email}</p>
              </div>
            </div>

            <div className="counselor-form-group">
              <label>Đánh giá tổng thể</label>
              <div className="counselor-rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`counselor-rating-star ${star <= form.rating ? 'active' : ''}`}
                    onClick={() => updateField('rating', star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              {form.rating > 0 && (
                <span style={{ marginTop: '6px', color: '#7a7a7a', fontSize: '12px' }}>
                  {form.rating}/5 sao
                </span>
              )}
              {errors.rating && (
                <span style={{ marginTop: '6px', color: '#dc2626', fontSize: '12px' }}>{errors.rating}</span>
              )}
            </div>

            <div className="counselor-form-group">
              <label>Nội dung feedback *</label>
              <textarea
                value={form.feedbackText}
                onChange={(e) => updateField('feedbackText', e.target.value)}
                placeholder="Viết phản hồi chi tiết cho sinh viên (ít nhất 50 ký tự)..."
                rows={6}
                style={{ minHeight: '150px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span className="counselor-form-hint">
                  {form.feedbackText.length}/50 ký tự tối thiểu
                </span>
                {errors.feedbackText && (
                  <span style={{ color: '#dc2626', fontSize: '12px' }}>{errors.feedbackText}</span>
                )}
              </div>
            </div>

            <div className="counselor-form-group">
              <label>Khuyến nghị (Recommendations)</label>
              <textarea
                value={form.recommendations}
                onChange={(e) => updateField('recommendations', e.target.value)}
                placeholder="Các bước tiếp theo mà sinh viên nên thực hiện..."
                rows={3}
              />
              <span className="counselor-form-hint">Tùy chọn - khuyến nghị sẽ hiển thị với sinh viên</span>
            </div>

            <div className="counselor-form-group">
              <label>Ghi chú riêng</label>
              <textarea
                value={form.privateNotes}
                onChange={(e) => updateField('privateNotes', e.target.value)}
                placeholder="Ghi chú cá nhân không hiển thị với sinh viên..."
                rows={2}
                style={{ background: '#fef9c3' }}
              />
              <div className="counselor-form-warning">
                <span>⚠️</span>
                <span>Sinh viên không nhìn thấy phần này</span>
              </div>
            </div>
          </div>

          <div className="counselor-modal-footer">
            <button
              type="button"
              className="counselor-btn counselor-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="counselor-btn counselor-btn-primary"
              disabled={saving}
              style={{ minWidth: '140px' }}
            >
              {saving ? 'Đang gửi...' : 'Gửi feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
