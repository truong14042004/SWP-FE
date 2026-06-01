import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { BrainCircuit, GitBranch, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { analyzeTalent, getTalentProfile } from '../talentApi';
import '../../../styles/talent-radar.css';

const AXES = [
  { key: 'logicalThinkingScore', label: 'Tư duy Logic', short: 'Logic', angle: -90 },
  { key: 'systemArchitectureScore', label: 'Tư duy Hệ thống', short: 'System', angle: 30 },
  { key: 'visualDesignScore', label: 'Cảm quan Giao diện', short: 'Visual', angle: 150 },
];

const CENTER = 130;
const RADIUS = 95;
const RINGS = [0.25, 0.5, 0.75, 1];

function polar(angleDeg, ratio) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(rad) * RADIUS * ratio,
    y: CENTER + Math.sin(rad) * RADIUS * ratio,
  };
}

function buildPolygon(scores) {
  return AXES.map((axis) => {
    const value = Math.min(Math.max(Number(scores?.[axis.key]) || 0, 0), 10) / 10;
    const point = polar(axis.angle, value);
    return `${point.x},${point.y}`;
  }).join(' ');
}

function scoreTone(value) {
  if (value >= 8) return 'excellent';
  if (value >= 6) return 'good';
  if (value >= 4) return 'fair';
  return 'low';
}

export function TalentRadarView({ session }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await getTalentProfile(session);
        if (active && result?.hasProfile) {
          setProfile(result);
          setRepoUrl(result.analyzedRepoUrl || '');
        }
      } catch {
        // Bỏ qua: học viên chưa có hồ sơ tài năng.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  async function handleAnalyze(event) {
    event.preventDefault();
    const trimmed = repoUrl.trim();
    if (!/^https?:\/\/github\.com\/[^/]+\/[^/]+/i.test(trimmed)) {
      toast.error('Vui lòng nhập đúng link Github repo (vd: https://github.com/user/repo).');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeTalent(session, trimmed);
      setProfile(result);
      toast.success('AI đã phân tích xong tài năng tiềm ẩn của bạn!');
    } catch (error) {
      toast.error(error?.message || 'Không thể phân tích repository này. Vui lòng thử lại.');
    } finally {
      setAnalyzing(false);
    }
  }

  const gridPoints = useMemo(
    () => RINGS.map((ratio) => AXES.map((axis) => {
      const point = polar(axis.angle, ratio);
      return `${point.x},${point.y}`;
    }).join(' ')),
    [],
  );

  const dataPolygon = useMemo(() => (profile ? buildPolygon(profile) : null), [profile]);

  return (
    <section className="talent-radar-page">
      <motion.div
        className="talent-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="talent-hero-icon">
          <BrainCircuit size={26} aria-hidden="true" />
        </div>
        <div className="talent-hero-copy">
          <span className="talent-eyebrow">AI Talent Discovery</span>
          <h1>Phân tích tài năng tiềm ẩn</h1>
          <p>
            AI đọc lịch sử commit Github của bạn để khám phá thế mạnh thực sự: tư duy logic,
            kiến trúc hệ thống hay cảm quan giao diện.
          </p>
        </div>
      </motion.div>

      <form className="talent-input-card" onSubmit={handleAnalyze}>
        <label htmlFor="talent-repo-url">Đường dẫn Github Repository</label>
        <div className="talent-input-row">
          <div className="talent-input-wrap">
            <GitBranch size={18} aria-hidden="true" />
            <input
              id="talent-repo-url"
              type="url"
              placeholder="https://github.com/username/project"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              disabled={analyzing}
            />
          </div>
          <button id="talent-analyze-btn" type="submit" className="talent-analyze-btn" disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 size={18} className="talent-spin" aria-hidden="true" />
                <span>Đang phân tích...</span>
              </>
            ) : profile ? (
              <>
                <RefreshCw size={18} aria-hidden="true" />
                <span>Phân tích lại</span>
              </>
            ) : (
              <>
                <Sparkles size={18} aria-hidden="true" />
                <span>Phân tích ngay</span>
              </>
            )}
          </button>
        </div>
        <small>AI sẽ đọc 10 commit gần nhất kèm nội dung thay đổi (diff) để chấm điểm phong cách code.</small>
      </form>

      {loading ? (
        <div className="talent-loading">
          <Loader2 size={28} className="talent-spin" aria-hidden="true" />
          <span>Đang tải hồ sơ tài năng...</span>
        </div>
      ) : profile ? (
        <motion.div
          className="talent-result-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <article className="talent-radar-card">
            <h2>Bản đồ năng lực</h2>
            <svg viewBox="0 0 260 260" className="talent-radar-svg" role="img" aria-label="Biểu đồ radar tài năng">
              {gridPoints.map((points, index) => (
                <polygon key={index} className="talent-grid-ring" points={points} />
              ))}
              {AXES.map((axis) => {
                const edge = polar(axis.angle, 1);
                const labelPos = polar(axis.angle, 1.22);
                return (
                  <g key={axis.key}>
                    <line className="talent-grid-axis" x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} />
                    <text
                      className="talent-axis-label"
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {axis.short}
                    </text>
                  </g>
                );
              })}
              {dataPolygon && (
                <motion.polygon
                  className="talent-data-polygon"
                  points={dataPolygon}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                />
              )}
              {AXES.map((axis) => {
                const value = Math.min(Math.max(Number(profile?.[axis.key]) || 0, 0), 10) / 10;
                const point = polar(axis.angle, value);
                return <circle key={axis.key} className="talent-data-dot" cx={point.x} cy={point.y} r={4} />;
              })}
            </svg>
          </article>

          <article className="talent-scores-card">
            <h2>Điểm chi tiết</h2>
            <div className="talent-score-list">
              {AXES.map((axis) => {
                const value = Math.min(Math.max(Number(profile?.[axis.key]) || 0, 0), 10);
                return (
                  <div key={axis.key} className="talent-score-item">
                    <div className="talent-score-head">
                      <span>{axis.label}</span>
                      <strong className={`talent-score-value ${scoreTone(value)}`}>{value}/10</strong>
                    </div>
                    <div className="talent-score-bar">
                      <motion.span
                        className={`talent-score-fill ${scoreTone(value)}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${value * 10}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 16, delay: 0.15 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="talent-feedback">
              <div className="talent-feedback-head">
                <Sparkles size={16} aria-hidden="true" />
                <span>Nhận xét từ AI</span>
              </div>
              <p>{profile.feedback || 'Chưa có nhận xét.'}</p>
            </div>
          </article>
        </motion.div>
      ) : (
        <div className="talent-empty">
          <BrainCircuit size={40} aria-hidden="true" />
          <h3>Chưa có dữ liệu phân tích</h3>
          <p>Nhập link Github repository của bạn phía trên và để AI khám phá tài năng tiềm ẩn.</p>
        </div>
      )}
    </section>
  );
}

export default TalentRadarView;
