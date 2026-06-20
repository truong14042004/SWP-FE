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
  const [submitted, setSubmitted] = useState(false);

  if (!roadmap) return null;

  const nodeCount = countNodes(roadmap.nodes);
  const hours = roadmap.totalEstimatedHours || totalHours(roadmap.nodes);

  async function handleApply() {
    if (submitted) return;

    setApplying(true);
    try {
      const result = await applyAiRoadmap(session, roadmap);
      toast.success('Đã gửi yêu cầu duyệt lộ trình tới cố vấn học tập. Lộ trình sẽ khả dụng sau khi được duyệt.');
      setSubmitted(true);
      onApplied?.(result);
    } catch (error) {
      toast.error(error.message || 'Không gửi được yêu cầu duyệt lộ trình.');
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
          <small>mô-đun</small>
        </div>
        <div>
          <strong>{hours || '—'}</strong>
          <small>giờ học ước tính</small>
        </div>
        {roadmap.careerRoleHint && (
          <div>
            <strong>{roadmap.careerRoleHint}</strong>
            <small>định hướng nghề nghiệp</small>
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
        disabled={applying || submitted}
      >
        {applying
          ? 'Đang gửi...'
          : submitted
            ? <><Check size={16} aria-hidden="true" /> Đã gửi yêu cầu duyệt</>
            : <><Check size={16} aria-hidden="true" /> Gửi yêu cầu duyệt lộ trình</>}
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
