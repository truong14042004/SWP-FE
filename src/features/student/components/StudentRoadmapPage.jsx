import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import '../../../styles/roadmap.css'
import {
  generateRoadmap,
  getRoadmapById,
  getRoadmaps,
  updateRoadmapNodeStatus,
} from '../roadmapApi';

const EMPTY_FORM = {
  careerRoleId: '',
  skillGapReportId: '',
  title: '',
  description: '',
};

const STATUS_META = {
  completed: {
    label: 'Đã hoàn thành',
    className: 'completed',
    icon: '✓',
  },
  verified: {
    label: 'Đã xác minh',
    className: 'completed',
    icon: '✓',
  },
  needreview: {
    label: 'Cần review',
    className: 'progressing',
    icon: '↻',
  },
  need_review: {
    label: 'Cần review',
    className: 'progressing',
    icon: '↻',
  },
  inprogress: {
    label: 'Đang tiến hành',
    className: 'progressing',
    icon: '↻',
  },
  done: {
    label: 'Đã hoàn thành',
    className: 'completed',
    icon: '✓',
  },
  in_progress: {
    label: 'Đang tiến hành',
    className: 'progressing',
    icon: '↻',
  },
  progressing: {
    label: 'Đang tiến hành',
    className: 'progressing',
    icon: '↻',
  },
  active: {
    label: 'Đang tiến hành',
    className: 'progressing',
    icon: '↻',
  },
  pending: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    icon: '○',
  },
  not_started: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    icon: '○',
  },
  notstarted: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    icon: '○',
  },
};

const ROADMAP_STATUS_OPTIONS = [
  { value: 'InProgress', label: 'Đang tiến hành' },
  { value: 'Completed', label: 'Đã hoàn thành' },
  { value: 'Verified', label: 'Đã xác minh' },
  { value: 'NeedReview', label: 'Cần review' },
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(status) {
  return String(status || 'pending')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_');
}

function getStatusMeta(status) {
  const normalized = normalizeStatus(status);

  return STATUS_META[normalized] || {
    label: status || 'Chưa bắt đầu',
    className: 'pending',
    icon: '○',
  };
}

function getRoadmapStatusValue(status) {
  const normalized = normalizeStatus(status);
  const matched = ROADMAP_STATUS_OPTIONS.find((option) => normalizeStatus(option.value) === normalized);
  return matched?.value || 'InProgress';
}

function sortRoadmaps(roadmaps) {
  return safeArray(roadmaps).slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

function getRoadmapNodes(roadmap) {
  const tree = safeArray(roadmap?.nodeTree);
  if (tree.length > 0) return tree;

  return safeArray(roadmap?.nodes)
    .slice()
    .sort((a, b) => {
      const levelA = Number(a.level || 0);
      const levelB = Number(b.level || 0);
      const orderA = Number(a.orderIndex || 0);
      const orderB = Number(b.orderIndex || 0);

      if (levelA !== levelB) return levelA - levelB;
      return orderA - orderB;
    });
}

function getNodeResources(node) {
  const resources = [];

  if (node?.learningResource) {
    resources.push(node.learningResource);
  }

  safeArray(node?.learningResources).forEach((resource) => {
    const duplicated = resources.some((item) => item.id && item.id === resource.id);
    if (!duplicated) resources.push(resource);
  });

  return resources;
}

function getChildren(node) {
  return safeArray(node?.children).filter((child) => typeof child === 'object');
}

function calculateTotalHours(nodes) {
  return safeArray(nodes).reduce((sum, node) => {
    return sum + Number(node.estimatedHours || 0) + calculateTotalHours(getChildren(node));
  }, 0);
}

function flattenNodes(nodes) {
  return safeArray(nodes).flatMap((node) => [
    node,
    ...flattenNodes(getChildren(node)),
  ]);
}

function normalizeProgress(value) {
  const number = Number(value || 0);
  if (number < 0) return 0;
  if (number > 100) return 100;
  return number;
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function isCompletedStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'completed' || normalized === 'verified' || normalized === 'done';
}

function isProgressNode(node) {
  return normalizeStatus(node?.nodeType) !== 'group';
}

function calculateProgressFromNodes(nodes) {
  const flat = flattenNodes(nodes).filter(isProgressNode);
  if (!flat.length) return 0;

  const completed = flat.filter((node) => isCompletedStatus(node.status)).length;
  return Math.round((completed / flat.length) * 100);
}

function updateNodeInList(nodes, nodeId, updater) {
  return safeArray(nodes).map((node) => {
    const nextNode = node.id === nodeId ? updater(node) : node;
    const children = getChildren(nextNode);

    if (!children.length) {
      return nextNode;
    }

    return {
      ...nextNode,
      children: updateNodeInList(children, nodeId, updater),
    };
  });
}

function updateRoadmapNode(roadmap, nodeId, updater) {
  if (!roadmap) return roadmap;

  const nextRoadmap = { ...roadmap };

  if (Array.isArray(nextRoadmap.nodeTree)) {
    nextRoadmap.nodeTree = updateNodeInList(nextRoadmap.nodeTree, nodeId, updater);
  }

  if (Array.isArray(nextRoadmap.nodes)) {
    nextRoadmap.nodes = updateNodeInList(nextRoadmap.nodes, nodeId, updater);
  }

  return nextRoadmap;
}

export function StudentRoadmapPage({ session }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingNodeId, setUpdatingNodeId] = useState('');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const roadmapNodes = useMemo(() => getRoadmapNodes(roadmap), [roadmap]);
  const flatNodes = useMemo(() => flattenNodes(roadmapNodes), [roadmapNodes]);

  const totalHours = useMemo(() => {
    return calculateTotalHours(roadmapNodes);
  }, [roadmapNodes]);

  const completedNodes = useMemo(() => {
    return flatNodes.filter((node) => isProgressNode(node) && isCompletedStatus(node.status)).length;
  }, [flatNodes]);

  const progressNodeCount = useMemo(() => {
    return flatNodes.filter(isProgressNode).length;
  }, [flatNodes]);

  const progress = flatNodes.length
    ? calculateProgressFromNodes(roadmapNodes)
    : normalizeProgress(roadmap?.progress);

  async function loadRoadmaps() {
    setLoadingList(true);
    setError('');
    setNotice('');

    try {
      const result = await getRoadmaps(session);
      const sorted = sortRoadmaps(result);

      setRoadmaps(sorted);

      if (sorted.length > 0) {
        await loadRoadmapDetail(sorted[0].id);
      } else {
        setRoadmap(null);
        setSelectedRoadmapId('');
        setShowGenerateForm(true);
      }
    } catch (requestError) {
      const message = requestError.message || 'Không tải được danh sách lộ trình.';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadRoadmapDetail(id) {
    if (!id) return;

    setLoadingDetail(true);
    setError('');
    setNotice('');
    setSelectedRoadmapId(id);

    try {
      const result = await getRoadmapById(session, id);
      setRoadmap(result);
      setShowGenerateForm(false);
    } catch (requestError) {
      const message = requestError.message || 'Không tải được chi tiết lộ trình.';
      setError(message);
      toast.error(message);
    } finally {
      setLoadingDetail(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleGenerate(event) {
    event.preventDefault();

    setGenerating(true);
    setNotice('');
    setError('');

    try {
      const payload = {
        careerRoleId: form.careerRoleId.trim(),
        skillGapReportId: form.skillGapReportId.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
      };

      const result = await generateRoadmap(session, payload);

      setRoadmap(result);
      setSelectedRoadmapId(result.id);
      setNotice('Đã tạo lộ trình học tập thành công.');
      toast.success('Đã tạo lộ trình học tập thành công.');
      setShowGenerateForm(false);
      setForm(EMPTY_FORM);

      const nextList = sortRoadmaps([result, ...roadmaps.filter((item) => item.id !== result.id)]);
      setRoadmaps(nextList);
    } catch (requestError) {
      const message = requestError.message || 'Không tạo được lộ trình.';
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleNodeStatusChange(node, status) {
    if (!node?.id) return;

    const previousRoadmap = roadmap;
    setUpdatingNodeId(node.id);
    setError('');
    setNotice('');
    setRoadmap((current) => {
      const next = updateRoadmapNode(current, node.id, (item) => ({ ...item, status }));
      return next ? { ...next, progress: calculateProgressFromNodes(getRoadmapNodes(next)) } : next;
    });

    try {
      const updated = await updateRoadmapNodeStatus(session, node.id, status);
      setRoadmap((current) => {
        const next = updateRoadmapNode(current, node.id, (item) => ({
          ...item,
          ...(updated && typeof updated === 'object' ? updated : {}),
          status: updated?.status || status,
        }));
        return next ? { ...next, progress: calculateProgressFromNodes(getRoadmapNodes(next)) } : next;
      });
      setNotice('Đã cập nhật trạng thái module.');
      toast.success('Đã cập nhật trạng thái module.');
    } catch (requestError) {
      const message = requestError.message || 'Không cập nhật được trạng thái module.';
      setRoadmap(previousRoadmap);
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingNodeId('');
    }
  }

  return (
    <section className="roadmap-page">
      <header className="roadmap-hero">
        <div>
          <span className="roadmap-eyebrow">⌘ Lộ trình học tập</span>
          <h1>
            {roadmap?.title || 'Lộ trình nghề nghiệp cá nhân'}
          </h1>
          <p>
            {roadmap?.description ||
              'Theo dõi roadmap học tập theo vai trò nghề nghiệp, skill gap và tài nguyên học tập được đề xuất.'}
          </p>
        </div>

        <div className="roadmap-actions-card">
          <button
            type="button"
            className="roadmap-main-action"
            onClick={() => setShowGenerateForm((current) => !current)}
          >
            {showGenerateForm ? 'Ẩn form tạo lộ trình' : '+ Tạo lộ trình mới'}
          </button>

          <button
            type="button"
            className="roadmap-secondary-action"
            onClick={loadRoadmaps}
            disabled={loadingList}
          >
            {loadingList ? 'Đang tải...' : 'Tải lại danh sách'}
          </button>
        </div>
      </header>

      {showGenerateForm && (
        <form className="roadmap-generate-card" onSubmit={handleGenerate}>
          <div className="roadmap-form-grid">
            <label>
              <span>Career Role ID</span>
              <input
                name="careerRoleId"
                value={form.careerRoleId}
                onChange={updateField}
                placeholder="UUID career role"
                required
              />
            </label>

            <label>
              <span>Skill Gap Report ID</span>
              <input
                name="skillGapReportId"
                value={form.skillGapReportId}
                onChange={updateField}
                placeholder="UUID skill gap report"
                required
              />
            </label>

            <label>
              <span>Tiêu đề lộ trình</span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Ví dụ: Lộ trình trở thành Backend Developer"
                required
              />
            </label>

            <label>
              <span>Mô tả</span>
              <input
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Mô tả ngắn về mục tiêu học tập"
              />
            </label>
          </div>

          <button type="submit" disabled={generating}>
            {generating ? 'Đang tạo lộ trình...' : 'Tạo lộ trình'}
          </button>
        </form>
      )}

      <section className="roadmap-layout">
        <aside className="roadmap-list-card">
          <div className="roadmap-list-head">
            <div>
              <h2>Danh sách lộ trình</h2>
              <p>{roadmaps.length} lộ trình</p>
            </div>
          </div>

          {loadingList ? (
            <div className="roadmap-list-empty">Đang tải danh sách...</div>
          ) : roadmaps.length === 0 ? (
            <div className="roadmap-list-empty">
              Chưa có lộ trình nào. Hãy tạo lộ trình đầu tiên.
            </div>
          ) : (
            <div className="roadmap-list">
              {roadmaps.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedRoadmapId === item.id ? 'active' : ''}
                  onClick={() => loadRoadmapDetail(item.id)}
                >
                  <strong>{item.title || 'Lộ trình chưa có tiêu đề'}</strong>
                  <span>{item.careerRoleName || 'Chưa có vai trò'}</span>
                  <small>
                    {normalizeProgress(item.progress)}% hoàn thành · {formatDate(item.updatedAt)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="roadmap-detail">
          {loadingDetail ? (
            <section className="roadmap-empty">
              <div>
                <span>⏳</span>
                <h2>Đang tải chi tiết</h2>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            </section>
          ) : !roadmap ? (
            <section className="roadmap-empty">
              <div>
                <span>🧭</span>
                <h2>Chưa có lộ trình</h2>
                <p>
                  Tạo lộ trình mới hoặc chọn một lộ trình có sẵn trong danh sách.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="roadmap-summary">
                <div>
                  <span>Tiến độ tổng thể</span>
                  <strong>{progress}%</strong>
                  <small>hoàn thành</small>
                </div>

                <div>
                  <span>Module đã hoàn thành</span>
                  <strong>{completedNodes}/{progressNodeCount || 0}</strong>
                  <small>module</small>
                </div>

                <div>
                  <span>Thời gian dự kiến</span>
                  <strong>{totalHours || 0}</strong>
                  <small>giờ</small>
                </div>

                <div className="roadmap-summary-progress">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </section>

              <section className="roadmap-content">
                {roadmapNodes.length === 0 ? (
                  <section className="roadmap-empty compact">
                    <div>
                      <span>📌</span>
                      <h2>Lộ trình chưa có node</h2>
                      <p>API đã trả về roadmap nhưng chưa có dữ liệu trong `nodes` hoặc `nodeTree`.</p>
                    </div>
                  </section>
                ) : (
                  <div className="roadmap-timeline">
                    {roadmapNodes.map((node, index) => (
                      <RoadmapNodeCard
                        key={node.id || `${node.title}-${index}`}
                        node={node}
                        index={index}
                        updatingNodeId={updatingNodeId}
                        onStatusChange={handleNodeStatusChange}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </section>
  );
}

function RoadmapNodeCard({ node, index, level = 0, updatingNodeId = '', onStatusChange }) {
  const statusMeta = getStatusMeta(node.status);
  const resources = getNodeResources(node);
  const children = getChildren(node);
  const priority = Number(node.priority || 0);

  const progress =
    statusMeta.className === 'completed'
      ? 100
      : statusMeta.className === 'progressing'
        ? 45
        : 0;

  return (
    <article
      className={`roadmap-node ${statusMeta.className}`}
      style={{ '--node-level': level }}
    >
      <div className="roadmap-node-marker">
        <span>{statusMeta.icon}</span>
      </div>

      <div className="roadmap-node-card">
        <div className="roadmap-node-top">
          <span className={`roadmap-status ${statusMeta.className}`}>
            {statusMeta.icon} {statusMeta.label}
          </span>

          <div className="roadmap-node-meta">
            {priority > 0 && <span>Ưu tiên {priority}</span>}
            <span>⏱ {node.estimatedHours || 0} giờ</span>
          </div>
        </div>

        <div className="roadmap-status-control">
          <label>
            <span>Trạng thái</span>
            <select
              value={getRoadmapStatusValue(node.status)}
              onChange={(event) => onStatusChange?.(node, event.target.value)}
              disabled={!node.id || updatingNodeId === node.id}
            >
              {ROADMAP_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="roadmap-node-main">
          <div>
            <small>Module #{index + 1}</small>
            <h2>{node.title || 'Chưa có tiêu đề'}</h2>
            <p>{node.description || 'Chưa có mô tả cho module này.'}</p>
          </div>

          {node.nodeType && (
            <span className="roadmap-node-type">
              {node.nodeType}
            </span>
          )}
        </div>

        {statusMeta.className !== 'pending' && (
          <div className="roadmap-node-progress">
            <div>
              <span>Tiến độ module</span>
              <strong>{progress}%</strong>
            </div>
            <div className="roadmap-progress-line">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {resources.length > 0 && (
          <div className="roadmap-resources">
            <span className="roadmap-resource-title">Tài liệu học tập</span>

            <div className="roadmap-resource-list">
              {resources.map((resource) => (
                <ResourceButton key={resource.id || resource.title} resource={resource} />
              ))}
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div className="roadmap-children">
            {children.map((child, childIndex) => (
              <RoadmapNodeCard
                key={child.id || `${child.title}-${childIndex}`}
                node={child}
                index={childIndex}
                level={level + 1}
                updatingNodeId={updatingNodeId}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ResourceButton({ resource }) {
  const label = resource.title || resource.skillName || 'Tài liệu học tập';

  const metaItems = [
    resource.resourceType,
    resource.contentType,
    resource.difficulty,
    resource.estimatedHours ? `${resource.estimatedHours} giờ` : '',
  ].filter(Boolean);

  const content = (
    <>
      <strong>{label}</strong>
      {metaItems.length > 0 && <small>{metaItems.join(' • ')}</small>}
    </>
  );

  if (resource.url) {
    return (
      <a
        className="roadmap-resource"
        href={resource.url}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" className="roadmap-resource">
      {content}
    </button>
  );
}
