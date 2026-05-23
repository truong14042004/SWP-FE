import { useState } from 'react';
import { toast } from 'react-toastify';
import { Check, ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import { applyAiRoadmap } from '../mentorApi';

function countNodes(nodes = []) {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children || []), 0);
}

function totalHours(nodes = []) {
  return nodes.reduce(
    (acc, node) => acc + (Number(node.estimatedHours) || 0) + totalHours(node.children || []),
    0
  );
}

export function RoadmapPreviewCard({ session, roadmap, onApplied }) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedResult, setAppliedResult] = useState(null);

  if (!roadmap) return null;

  const nodeCount = countNodes(roadmap.nodes);
  const hours = roadmap.totalEstimatedHours || totalHours(roadmap.nodes);

  async function handleApply() {
    if (appliedResult) {
      onApplied?.(appliedResult);
      return;
    }

    setApplying(true);
    try {
      const result = await applyAiRoadmap(session, roadmap);
      const isExisting = result?.isExisting || result?.IsExisting;
      toast.success(isExisting ? 'Roadmap này đã tồn tại — đang mở lộ trình hiện có.' : 'Đã tạo roadmap mới từ gợi ý AI.');
      setAppliedResult(result);
      onApplied?.(result);
    } catch (error) {
      toast.error(error.message || 'Không áp dụng được roadmap.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <article className="ai-roadmap-card">
      <header>
        <span className="ai-roadmap-eyebrow">Lộ trình đề xuất</span>
        <h3>{roadmap.title}</h3>
        {roadmap.description && <p>{roadmap.description}</p>}
      </header>

      <div className="ai-roadmap-stats">
        <div>
          <strong>{nodeCount}</strong>
          <small>module</small>
        </div>
        <div>
          <strong>{hours || '—'}</strong>
          <small>giờ học ước tính</small>
        </div>
        {roadmap.careerRoleHint && (
          <div>
            <strong>{roadmap.careerRoleHint}</strong>
            <small>career role</small>
          </div>
        )}
      </div>

      <button
        type="button"
        className="ai-roadmap-toggle"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? <><ChevronDown size={16} aria-hidden="true" /> Thu gọn cấu trúc</> : <><ChevronRight size={16} aria-hidden="true" /> Xem chi tiết các module</>}
      </button>

      {expanded && (
        <div className="ai-roadmap-tree">
          {(roadmap.nodes || []).map((node, index) => (
            <RoadmapTreeNode key={index} node={node} level={0} />
          ))}
        </div>
      )}

      <button
        type="button"
        className="ai-roadmap-apply"
        onClick={handleApply}
        disabled={applying}
      >
        {applying ? 'Đang xử lý...' : appliedResult ? <><Check size={16} aria-hidden="true" /> Đi đến lộ trình này</> : <><Check size={16} aria-hidden="true" /> Áp dụng roadmap này</>}
      </button>
    </article>
  );
}

function RoadmapTreeNode({ node, level }) {
  return (
    <div className="ai-roadmap-tree-node" style={{ '--depth': level }}>
      <div className="ai-roadmap-tree-row">
        <strong>
          {node.nodeType === 'Group' ? <Folder size={15} aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />} {node.title}
        </strong>
        {node.estimatedHours && <small>{node.estimatedHours}h</small>}
      </div>
      {node.description && <p>{node.description}</p>}
      {(node.children || []).map((child, idx) => (
        <RoadmapTreeNode key={idx} node={child} level={level + 1} />
      ))}
    </div>
  );
}
