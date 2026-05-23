import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, Circle, Clock3, Compass, LoaderCircle, Pin, RefreshCw } from 'lucide-react';
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
import {
  cancelReviewRequest,
  getReviewRequestsForNode,
} from '../../roadmap-review/reviewApi';
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
    Icon: Check,
  },
  verified: {
    label: 'Đã xác minh',
    className: 'completed',
    Icon: Check,
  },
  needreview: {
    label: 'Cần review',
    className: 'progressing',
    Icon: RefreshCw,
  },
  need_review: {
    label: 'Cần review',
    className: 'progressing',
    Icon: RefreshCw,
  },
  inprogress: {
    label: 'Đang tiến hành',
    className: 'progressing',
    Icon: RefreshCw,
  },
  done: {
    label: 'Đã hoàn thành',
    className: 'completed',
    Icon: Check,
  },
  in_progress: {
    label: 'Đang tiến hành',
    className: 'progressing',
    Icon: RefreshCw,
  },
  progressing: {
    label: 'Đang tiến hành',
    className: 'progressing',
    Icon: RefreshCw,
  },
  active: {
    label: 'Đang tiến hành',
    className: 'progressing',
    Icon: RefreshCw,
  },
  pending: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    Icon: Circle,
  },
  not_started: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    Icon: Circle,
  },
  notstarted: {
    label: 'Chưa bắt đầu',
    className: 'pending',
    Icon: Circle,
  },
};

const ROADMAP_STATUS_OPTIONS = [
  { value: 'NotStarted', label: 'Chưa bắt đầu' },
  { value: 'InProgress', label: 'Đang tiến hành' },
  { value: 'Completed', label: 'Đã hoàn thành' },
  { value: 'NeedReview', label: 'Cần mentor review' },
];

function extractReviewRequestList(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.requests)) return result.requests;
  if (Array.isArray(result?.reviewRequests)) return result.reviewRequests;
  return [];
}

function getReviewRequestStatus(request) {
  return request?.status || request?.reviewStatus || request?.requestStatus || '';
}

function isRejectedReviewStatus(status) {
  return normalizeStatus(status) === 'rejected';
}

function getReviewerName(request) {
  return (
    request?.reviewerFullName ||
    request?.reviewerName ||
    request?.reviewer?.fullName ||
    request?.reviewer?.name ||
    request?.reviewerEmail ||
    request?.reviewer?.email ||
    'Reviewer'
  );
}

function getReviewerNote(request) {
  return (
    request?.reviewerNote ||
    request?.note ||
    request?.feedback ||
    request?.comment ||
    ''
  );
}

function getReviewRequestDate(request) {
  return (
    request?.respondedAt ||
    request?.reviewedAt ||
    request?.updatedAt ||
    request?.createdAt ||
    request?.submittedAt
  );
}

function formatReviewDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getLatestReviewRequest(requests) {
  return (
    safeArray(requests)
      .slice()
      .sort((a, b) => {
        const dateA = new Date(getReviewRequestDate(a) || 0).getTime();
        const dateB = new Date(getReviewRequestDate(b) || 0).getTime();
        return dateB - dateA;
      })[0] || null
  );
}

function getRejectedReviewRequest(requests) {
  const latest = getLatestReviewRequest(requests);

  if (!latest) return null;

  return isRejectedReviewStatus(getReviewRequestStatus(latest)) ? latest : null;
}
function getReviewRequestId(request) {
  return request?.id || request?.requestId || request?.reviewRequestId;
}

function isPendingReviewStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'pending' || normalized === 'needreview' || normalized === 'need_review';
}

function getPendingReviewRequest(requests) {
  return (
    safeArray(requests).find((request) =>
      isPendingReviewStatus(getReviewRequestStatus(request))
    ) || null
  );
}

function getGroupReviewStats(node) {
  const reviewableChildren = getChildren(node).filter(isProgressNode);
  const total = reviewableChildren.length;
  const completed = reviewableChildren.filter((child) =>
    isCompletedStatus(child.status)
  ).length;

  return {
    total,
    completed,
    canRequest: Boolean(node?.id) && total > 0 && completed === total,
  };
}
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
    Icon: Circle,
  };
}

function getDisplayNodeStatus(node, roadmapStatus) {
  const nodeStatus = normalizeStatus(node?.status);
  const parentStatus = normalizeStatus(roadmapStatus);
  const isGroup = !isProgressNode(node);

  if (isGroup) {
    const childNodes = flattenNodes(getChildren(node)).filter(isProgressNode);

    if (childNodes.length > 0) {
      return getRoadmapStatusFromNodes(getChildren(node), node?.status);
    }
  }

  if (isGroup && ['notstarted', 'not_started', 'pending'].includes(nodeStatus) && parentStatus === 'active') {
    return roadmapStatus;
  }

  return node?.status;
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

  const nodes = safeArray(roadmap?.nodes)
    .slice()
    .sort((a, b) => {
      const levelA = Number(a.level || 0);
      const levelB = Number(b.level || 0);
      const orderA = Number(a.orderIndex || 0);
      const orderB = Number(b.orderIndex || 0);

      if (levelA !== levelB) return levelA - levelB;
      return orderA - orderB;
    });

  if (!nodes.some((node) => node.parentNodeId)) {
    return nodes;
  }

  const byId = new Map();
  nodes.forEach((node) => {
    byId.set(node.id, { ...node, children: [] });
  });

  const roots = [];
  nodes.forEach((node) => {
    const current = byId.get(node.id);
    const parent = byId.get(node.parentNodeId);

    if (parent) {
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  });

  return roots;
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

function getRoadmapStatusFromNodes(nodes, fallbackStatus) {
  const flat = flattenNodes(nodes).filter(isProgressNode);
  if (!flat.length) return fallbackStatus || 'NotStarted';

  const completedCount = flat.filter((node) => isCompletedStatus(node.status)).length;
  if (completedCount === flat.length) return 'Completed';

  const hasNeedReview = flat.some((node) => {
    const status = normalizeStatus(node.status);
    return status === 'needreview' || status === 'need_review';
  });
  if (hasNeedReview) return 'NeedReview';

  const hasStarted = flat.some((node) => {
    const status = normalizeStatus(node.status);
    return !['notstarted', 'not_started', 'pending'].includes(status);
  });
  if (hasStarted) return 'InProgress';

  return fallbackStatus || 'NotStarted';
}

function summarizeRoadmap(roadmap) {
  if (!roadmap) return roadmap;

  const nodes = getRoadmapNodes(roadmap);
  const hasProgressNodes = flattenNodes(nodes).filter(isProgressNode).length > 0;
  const progress = hasProgressNodes ? calculateProgressFromNodes(nodes) : normalizeProgress(roadmap.progress);

  return {
    ...roadmap,
    progress,
    status: hasProgressNodes ? getRoadmapStatusFromNodes(nodes, roadmap.status) : roadmap.status,
    updatedAt: new Date().toISOString(),
  };
}

function getNodeProgress(node) {
  if (node?.progress !== undefined && node?.progress !== null) {
    return normalizeProgress(node.progress);
  }

  return isCompletedStatus(node?.status) ? 100 : 0;
}

function isNodeUpdateResponse(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Array.isArray(value.nodeTree) &&
    !Array.isArray(value.nodes)
  );
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
  const [reviewModalNode, setReviewModalNode] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updatingNodeId, setUpdatingNodeId] = useState('');

  const [error, setError] = useState('');
  const detailRequestRef = useRef(0);

const [reviewRequestsByNodeId, setReviewRequestsByNodeId] = useState({});
const [cancelingReviewRequestId, setCancelingReviewRequestId] = useState('');
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
  const RoadmapStatusIcon = getStatusMeta(roadmap?.status).Icon;
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

    try {
      const result = await getRoadmaps(session);
      const sorted = sortRoadmaps(safeArray(result).map(summarizeRoadmap));

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

    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setLoadingDetail(true);
    setError('');
    setSelectedRoadmapId(id);

    try {
     const result = await getRoadmapById(session, id);
if (detailRequestRef.current !== requestId) return;

const summarizedRoadmap = summarizeRoadmap(result);

setRoadmap(summarizedRoadmap);
setShowGenerateForm(false);
loadReviewRequestsForRoadmap(summarizedRoadmap);
    } catch (requestError) {
      if (detailRequestRef.current !== requestId) return;
      const message = requestError.message || 'Không tải được chi tiết lộ trình.';
      setError(message);
      toast.error(message);
    } finally {
      if (detailRequestRef.current === requestId) {
        setLoadingDetail(false);
      }
    }
  }
async function loadReviewRequestsForRoadmap(roadmapData) {
  const nodes = flattenNodes(getRoadmapNodes(roadmapData)).filter((node) => node?.id);
  const nodeIds = Array.from(new Set(nodes.map((node) => node.id)));

  if (!nodeIds.length) {
    setReviewRequestsByNodeId({});
    return;
  }

  const results = await Promise.allSettled(
    nodeIds.map(async (nodeId) => {
      const response = await getReviewRequestsForNode(session, nodeId);
      return [nodeId, extractReviewRequestList(response)];
    })
  );

  const nextRequests = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const [nodeId, requests] = result.value;
      nextRequests[nodeId] = requests;
    }
  });

  setReviewRequestsByNodeId(nextRequests);
}
  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleGenerate(event) {
    event.preventDefault();

    setGenerating(true);
    setError('');

    try {
      const payload = {
        careerRoleId: form.careerRoleId.trim(),
        skillGapReportId: latestSkillGap?.id || null,
        title: form.title.trim() || null,
        description: form.description.trim() || null,
      };

      const result = await generateRoadmap(session, payload);
      const detail = result?.id
        ? await getRoadmapById(session, result.id).catch(() => result)
        : result;

      const summarizedDetail = summarizeRoadmap(detail);
      setRoadmap(summarizedDetail);
      setSelectedRoadmapId(summarizedDetail?.id || result?.id || '');
      toast.success('Đã tạo lộ trình học tập thành công.');
      setShowGenerateForm(false);
      setForm(EMPTY_FORM);

      const listItem = summarizedDetail || result;
      const nextList = sortRoadmaps([listItem, ...roadmaps.filter((item) => item.id !== listItem.id)]);
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
    setRoadmap((current) => {
      const next = updateRoadmapNode(current, node.id, (item) => ({ ...item, status }));
      const summarized = summarizeRoadmap(next);
      setRoadmaps((items) => items.map((item) => (item.id === summarized?.id ? { ...item, ...summarized } : item)));
      return summarized;
    });

    try {
      const updated = await updateRoadmapNodeStatus(session, node.id, status);
      setRoadmap((current) => {
        // Only merge primitive fields; never spread the whole node response
        // because BE returns Children = empty for single-node update,
        // which would erase children in the local tree.
        const next = updateRoadmapNode(current, node.id, (item) => ({
          ...item,
          ...(isNodeUpdateResponse(updated) ? updated : {}),
          status: isNodeUpdateResponse(updated) ? updated.status || status : status,
        }));
        const summarized = summarizeRoadmap(next);
        setRoadmaps((items) => items.map((item) => (item.id === summarized?.id ? { ...item, ...summarized } : item)));
        return summarized;
      });
      toast.success('Đã cập nhật trạng thái module.');

      // If student moved this node into NeedReview, auto-open the modal
      // so they can pick a reviewer and attach evidence right away.
      if (status === 'NeedReview') {
        setReviewModalNode({ ...node, status: 'NeedReview' });
      }
    } catch (requestError) {
      const message = requestError.message || 'Không cập nhật được trạng thái module.';
      setRoadmap(previousRoadmap);
      if (previousRoadmap) {
        setRoadmaps((items) => items.map((item) => (item.id === previousRoadmap.id ? { ...item, ...previousRoadmap } : item)));
      }
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingNodeId('');
    }
  }
async function handleCancelReviewRequest(node, request) {
  const requestId = getReviewRequestId(request);

  if (!requestId) {
    toast.error('Không tìm thấy yêu cầu review cần hủy.');
    return;
  }

  const confirmed = window.confirm(
    `Bạn chắc chắn muốn hủy yêu cầu review cho "${node?.title || 'module này'}"?`
  );

  if (!confirmed) return;

  setCancelingReviewRequestId(requestId);

  try {
    await cancelReviewRequest(session, requestId);
    toast.success('Đã hủy yêu cầu review.');

    if (selectedRoadmapId) {
      await loadRoadmapDetail(selectedRoadmapId);
    }
  } catch (requestError) {
    toast.error(requestError.message || 'Không hủy được yêu cầu review.');
  } finally {
    setCancelingReviewRequestId('');
  }
}
  return (
    <>
    <section className="roadmap-page">
      <header className="roadmap-hero">
        <div>
          <span className="roadmap-eyebrow"><Compass size={16} aria-hidden="true" /> Lộ trình học tập</span>
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

      {error && (
        <div className="roadmap-alert error" role="alert">
          {error}
        </div>
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
          ) : roadmaps.length === 0 && error ? (
            <div className="roadmap-list-empty">
              Không tải được danh sách lộ trình. Hãy thử tải lại.
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
                    {getStatusMeta(item.status).label} · {normalizeProgress(item.progress)}% hoàn thành · {formatDate(item.updatedAt)}
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
                <span><LoaderCircle size={28} aria-hidden="true" /></span>
                <h2>Đang tải chi tiết</h2>
                <p>Vui lòng chờ trong giây lát.</p>
              </div>
            </section>
          ) : !roadmap ? (
            <section className="roadmap-empty">
              <div>
                <span><Compass size={28} aria-hidden="true" /></span>
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
                      <span><Pin size={28} aria-hidden="true" /></span>
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
  roadmapStatus={roadmap?.status}
  updatingNodeId={updatingNodeId}
  onStatusChange={handleNodeStatusChange}
  onRequestReview={(reviewNode) => setReviewModalNode(reviewNode)}
  onCancelReviewRequest={handleCancelReviewRequest}
  reviewRequestsByNodeId={reviewRequestsByNodeId}
  cancelingReviewRequestId={cancelingReviewRequestId}
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
  setReviewModalNode(null);

  if (selectedRoadmapId) {
    loadRoadmapDetail(selectedRoadmapId);
  }
}}
        />
      )}
    </>
  );
}

function RoadmapNodeCard({
  node,
  index,
  level = 0,
  roadmapStatus = '',
  updatingNodeId = '',
  onStatusChange,
  onRequestReview,
  onCancelReviewRequest,
  reviewRequestsByNodeId = {},
  cancelingReviewRequestId = '',
}) {
  const displayStatus = getDisplayNodeStatus(node, roadmapStatus);
  const statusMeta = getStatusMeta(displayStatus);
  const StatusIcon = statusMeta.Icon;
  const resources = getNodeResources(node);
  const children = getChildren(node);
  const priority = Number(node.priority || 0);
  const isGroup = !isProgressNode(node);
  const progress = getNodeProgress(node);

  const reviewRequests = node?.id ? reviewRequestsByNodeId[node.id] || [] : [];
  const pendingRequest = getPendingReviewRequest(reviewRequests);
  const rejectedRequest = getRejectedReviewRequest(reviewRequests);
  const rejectedDate = formatReviewDate(getReviewRequestDate(rejectedRequest));
  const pendingDate = formatReviewDate(getReviewRequestDate(pendingRequest));
  const pendingRequestId = getReviewRequestId(pendingRequest);

  const groupReviewStats = isGroup ? getGroupReviewStats(node) : null;

  const canRequestReview =
    !isGroup &&
    Boolean(node?.id) &&
    isCompletedStatus(node.status) &&
    normalizeStatus(node.status) !== 'verified' &&
    !pendingRequest;

  return (
    <article
      className={`roadmap-node ${statusMeta.className}`}
      style={{ '--node-level': level, '--node-index': index }}
    >
      <div className="roadmap-node-marker">
        <span><StatusIcon size={14} aria-hidden="true" /></span>
      </div>

      <div className="roadmap-node-card">
        <div className="roadmap-node-top">
          <span className={`roadmap-status ${statusMeta.className}`}>
            <StatusIcon size={14} aria-hidden="true" /> {statusMeta.label}
          </span>

          <div className="roadmap-node-meta">
            {priority > 0 && <span>Ưu tiên {priority}</span>}
            <span><Clock3 size={14} aria-hidden="true" /> {node.estimatedHours || 0} giờ</span>
          </div>
        </div>

        {!isGroup && (
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
        )}

        {isGroup && groupReviewStats?.total > 0 && (
          <div className="roadmap-review-card ready">
            <div>
              <strong>Review theo nhóm module</strong>
              <small>
                {groupReviewStats.completed}/{groupReviewStats.total} module con trực tiếp đã hoàn thành.
              </small>
            </div>

            <button
              type="button"
              className="roadmap-review-action primary"
              onClick={() => onRequestReview?.(node)}
              disabled={!groupReviewStats.canRequest || Boolean(pendingRequest)}
            >
              {pendingRequest
                ? 'Đang chờ review'
                : groupReviewStats.canRequest
                ? 'Xin review nhóm'
                : 'Hoàn thành module con trước'}
            </button>
          </div>
        )}

        {pendingRequest && (
          <div className="roadmap-review-card pending">
            <div>
              <strong>Đang chờ reviewer xác nhận</strong>
              <small>
                Reviewer: {getReviewerName(pendingRequest)}
                {pendingDate ? ` · Gửi lúc ${pendingDate}` : ''}
              </small>
            </div>

            <button
              type="button"
              className="roadmap-review-action danger"
              onClick={() => onCancelReviewRequest?.(node, pendingRequest)}
              disabled={cancelingReviewRequestId === pendingRequestId}
            >
              {cancelingReviewRequestId === pendingRequestId ? 'Đang hủy...' : 'Hủy yêu cầu'}
            </button>
          </div>
        )}

        {rejectedRequest && (
          <div className="roadmap-review-card rejected">
            <div>
              <strong>Reviewer đã từ chối — cần cải thiện evidence</strong>

              <p>
                {getReviewerNote(rejectedRequest) ||
                  'Reviewer chưa để lại ghi chú chi tiết.'}
              </p>

              <small>
                Reviewer: {getReviewerName(rejectedRequest)}
                {rejectedDate ? ` · Phản hồi lúc ${rejectedDate}` : ''}
              </small>
            </div>

            {!pendingRequest && (
              <button
                type="button"
                className="roadmap-review-action primary"
                onClick={() => onRequestReview?.(node)}
              >
                Xin review lại
              </button>
            )}
          </div>
        )}

        {canRequestReview && !rejectedRequest && (
          <div className="roadmap-review-card ready">
            <div>
              <strong>Module đã hoàn thành — sẵn sàng xin review</strong>
              <small>Gửi Git repository hoặc evidence để mentor/counselor xác nhận.</small>
            </div>

            <button
              type="button"
              className="roadmap-review-action primary"
              onClick={() => onRequestReview?.(node)}
            >
              Xin review
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

        {!isGroup && statusMeta.className !== 'pending' && (
          <div className="roadmap-node-progress">
            <div className="roadmap-node-progress-head">
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
                roadmapStatus={roadmapStatus}
                updatingNodeId={updatingNodeId}
                onStatusChange={onStatusChange}
                onRequestReview={onRequestReview}
                onCancelReviewRequest={onCancelReviewRequest}
                reviewRequestsByNodeId={reviewRequestsByNodeId}
                cancelingReviewRequestId={cancelingReviewRequestId}
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
      <strong>{label}{resource.url ? ' ↗' : ''}</strong>
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
