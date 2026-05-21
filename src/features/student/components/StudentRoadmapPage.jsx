import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import '../../../styles/roadmap.css'
import {
  generateRoadmap,
  getRoadmapById,
  getRoadmaps,
  updateRoadmapNodeStatus,
} from '../roadmapApi';
import { getCareerRoles } from '../studentApi';
import { getLatestSkillGap } from '../skillsApi';
import { NodeReviewRequestModal } from './NodeReviewRequestModal';

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
  { value: 'NotStarted', label: 'Chưa bắt đầu' },
  { value: 'InProgress', label: 'Đang tiến hành' },
  { value: 'Completed', label: 'Đã hoàn thành' },
  { value: 'NeedReview', label: 'Cần mentor review' },
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
  const [careerRoles, setCareerRoles] = useState([]);
  const [latestSkillGap, setLatestSkillGap] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingNodeId, setUpdatingNodeId] = useState('');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [listError, setListError] = useState(false);
  const detailRequestRef = useRef(0);

  const [reviewModalNode, setReviewModalNode] = useState(null);

  useEffect(() => {
    loadRoadmaps();
    loadFormReferences();
  }, []);

  async function loadFormReferences() {
    try {
      const [roles, latestGap] = await Promise.all([
        getCareerRoles().catch(() => []),
        getLatestSkillGap(session).catch(() => null),
      ]);
      setCareerRoles(
        Array.isArray(roles) ? roles.filter((role) => role?.isActive !== false) : [],
      );
      setLatestSkillGap(latestGap);
    } catch {
      // ignore — references là optional
    }
  }

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
    setListError(false);

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
      setListError(true);
      toast.error(message);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadRoadmapDetail(id) {
    if (!id) return;

    const requestId = ++detailRequestRef.current;
    setLoadingDetail(true);
    setError('');
    setNotice('');
    setSelectedRoadmapId(id);

    try {
      const result = await getRoadmapById(session, id);
      // Ignore stale response if user clicked another roadmap meanwhile.
      if (requestId !== detailRequestRef.current) return;
      setRoadmap(result);
      setShowGenerateForm(false);
    } catch (requestError) {
      if (requestId !== detailRequestRef.current) return;
      const message = requestError.message || 'Không tải được chi tiết lộ trình.';
      setError(message);
      toast.error(message);
    } finally {
      if (requestId === detailRequestRef.current) {
        setLoadingDetail(false);
      }
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
        skillGapReportId: latestSkillGap?.id || null,
        title: form.title.trim() || null,
        description: form.description.trim() || null,
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
        // Only merge primitive fields; never spread the whole node response
        // because BE returns Children = empty for single-node update,
        // which would erase children in the local tree.
        const next = updateRoadmapNode(current, node.id, (item) => ({
          ...item,
          status: updated?.status || status,
          updatedAt: updated?.updatedAt || item.updatedAt,
        }));
        return next ? { ...next, progress: calculateProgressFromNodes(getRoadmapNodes(next)) } : next;
      });
      setNotice('Đã cập nhật trạng thái module.');
      toast.success('Đã cập nhật trạng thái module.');

      // If student moved this node into NeedReview, auto-open the modal
      // so they can pick a reviewer and attach evidence right away.
      if (status === 'NeedReview') {
        setReviewModalNode({ ...node, status: 'NeedReview' });
      }
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
    <>
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

      {error && <div className="roadmap-alert error">{error}</div>}
      {notice && <div className="roadmap-alert success">{notice}</div>}

      {showGenerateForm && (
        <form className="roadmap-generate-card" onSubmit={handleGenerate}>
          <div className="roadmap-form-grid">
            <label>
              <span>Vai trò nghề nghiệp</span>
              <select
                name="careerRoleId"
                value={form.careerRoleId}
                onChange={updateField}
                required
              >
                <option value="">Chọn vai trò mục tiêu</option>
                {careerRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.level ? ` · ${role.level}` : ''}
                  </option>
                ))}
              </select>
              <small>
                Hệ thống sẽ tạo lộ trình dựa trên yêu cầu của vai trò này.
              </small>
            </label>

            <label>
              <span>Báo cáo skill gap (tự động)</span>
              <input
                type="text"
                value={
                  latestSkillGap
                    ? `Báo cáo gần nhất · ${formatDate(latestSkillGap.createdAt || latestSkillGap.updatedAt)}`
                    : 'Chưa có báo cáo — sẽ dùng yêu cầu chung của vai trò'
                }
                disabled
                readOnly
              />
              <small>
                Backend tự dùng báo cáo skill gap mới nhất nếu có. Bạn không cần nhập ID.
              </small>
            </label>

            <label>
              <span>Tiêu đề lộ trình</span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Ví dụ: Lộ trình trở thành Backend Developer"
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

          <button type="submit" disabled={generating || !form.careerRoleId}>
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
          ) : listError ? (
            <div className="roadmap-list-empty">
              Không tải được danh sách. Vui lòng bấm “Tải lại danh sách”.
            </div>
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
                        onRequestGroupReview={(groupNode) => setReviewModalNode(groupNode)}
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

      {reviewModalNode && (
        <NodeReviewRequestModal
          session={session}
          node={reviewModalNode}
          onClose={() => setReviewModalNode(null)}
          onSubmitted={() => {
            // Refresh roadmap detail để lấy node status mới (NeedReview).
            if (selectedRoadmapId) {
              loadRoadmapDetail(selectedRoadmapId);
            }
          }}
        />
      )}
    </>
  );
}

function RoadmapNodeCard({ node, index, level = 0, updatingNodeId = '', onStatusChange, onRequestGroupReview }) {
  const statusMeta = getStatusMeta(node.status);
  const resources = getNodeResources(node);
  const children = getChildren(node);
  const priority = Number(node.priority || 0);
  const isGroup = String(node.nodeType || '').toLowerCase() === 'group';
  const isVerified = normalizeStatus(node.status) === 'verified';
  const isPendingReview = normalizeStatus(node.status) === 'needreview';
  const canUpdate = !isGroup && !isVerified && Boolean(node.id);

  // Group review readiness: count non-group children that are Completed or Verified
  const nonGroupChildren = children.filter(
    (child) => String(child.nodeType || '').toLowerCase() !== 'group'
  );
  const completedChildren = nonGroupChildren.filter((child) => {
    const status = normalizeStatus(child.status);
    return status === 'completed' || status === 'verified';
  });
  const groupReadyForReview =
    isGroup
    && nonGroupChildren.length > 0
    && completedChildren.length === nonGroupChildren.length
    && !isVerified;

  return (
    <article
      className={`roadmap-node ${statusMeta.className}`}
      style={{ '--node-level': level, '--node-index': index }}
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

        {canUpdate ? (
          <div className="roadmap-status-control">
            <label>
              <span>Trạng thái</span>
              <select
                value={getRoadmapStatusValue(node.status)}
                onChange={(event) => onStatusChange?.(node, event.target.value)}
                disabled={updatingNodeId === node.id}
              >
                {ROADMAP_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : isVerified ? (
          <div className="roadmap-status-control verified">
            <span className="roadmap-status-locked">
              ✓ Đã được mentor xác minh — không thể chỉnh sửa
            </span>
          </div>
        ) : null}

        {isGroup && nonGroupChildren.length > 0 && !isVerified && (
          <div className="roadmap-group-review">
            <div className="roadmap-group-review-stats">
              <strong>
                {completedChildren.length}/{nonGroupChildren.length} module đã hoàn thành
              </strong>
              <small>
                {groupReadyForReview
                  ? 'Đủ điều kiện yêu cầu review nhóm'
                  : 'Hoàn thành tất cả module để mở review nhóm'}
              </small>
            </div>
            <button
              type="button"
              className="roadmap-group-review-btn"
              disabled={!groupReadyForReview || isPendingReview}
              onClick={() => onRequestGroupReview?.(node)}
            >
              {isPendingReview
                ? 'Yêu cầu review đang chờ'
                : '✓ Yêu cầu review nhóm'}
            </button>
          </div>
        )}

        <div className="roadmap-node-main">
          <div>
            <small>{isGroup ? `Nhóm #${index + 1}` : `Module #${index + 1}`}</small>
            <h2>{node.title || 'Chưa có tiêu đề'}</h2>
            <p>{node.description || 'Chưa có mô tả cho module này.'}</p>
          </div>

          {node.nodeType && (
            <span className="roadmap-node-type">
              {node.nodeType}
            </span>
          )}
        </div>

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
                onRequestGroupReview={onRequestGroupReview}
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
        <span className="roadmap-resource-icon" aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <button type="button" className="roadmap-resource">
      {content}
    </button>
  );
}
