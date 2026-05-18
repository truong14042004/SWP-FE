import { useEffect, useState } from 'react';
import { AdminLayout } from './components/AdminLayout';
import {
  deleteAdminUser,
  deleteCareerRole,
  deleteLearningResource,
  deleteRoleSkillRequirement,
  deleteSkill,
  deleteSubscriptionPlan,
  getAdminUser,
  getCareerRole,
  getLearningResource,
  getPayment,
  getRoleSkillRequirement,
  getSkill,
  getSubscriptionPlan,
  loadAdminDashboard,
  saveCareerRole,
  saveLearningResource,
  saveRoleSkillRequirement,
  saveSkill,
  saveSubscriptionPlan,
  updatePaymentStatus,
  updateUserStatus,
  uploadLearningResource,
} from './adminApi';
import { OverviewView } from './views/OverviewView';
import { UsersView } from './views/UsersView';
import { PaymentsView } from './views/PaymentsView';
import { PlansView } from './views/PlansView';
import { LearningView } from './views/LearningView';
import { SkillsView } from './views/SkillsView';
import { ResourcesView } from './views/ResourcesView';
import { RequirementsView } from './views/RequirementsView';
import { CareerRolesView } from './views/CareerRolesView';

export function AdminDashboard({ session, onSignOut }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      setData(await loadAdminDashboard(session));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action, successMessage) {
    setError('');
    setNotice('');
    try {
      await action();
      if (successMessage) {
        setNotice(successMessage);
      }
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSelectUser(id) {
    await runAction(async () => {
      setSelectedUser(await getAdminUser(session, id));
    });
  }

  async function handleToggleUserStatus(user) {
    await runAction(
      () => updateUserStatus(session, user.id, !user.isActive),
      user.isActive ? 'Đã vô hiệu hóa user.' : 'Đã kích hoạt user.',
    );
  }

  async function handleDeleteUser(user) {
    await runAction(async () => {
      await deleteAdminUser(session, user.id);
      setSelectedUser(null);
    }, 'Đã xóa mềm user. Lịch sử thanh toán vẫn được giữ.');
  }

  async function handleSelectPayment(id) {
    await runAction(async () => {
      setSelectedPayment(await getPayment(session, id));
    });
  }

  async function handleUpdatePaymentStatus(id, status) {
    await runAction(async () => {
      const updated = await updatePaymentStatus(session, id, status);
      setSelectedPayment(updated);
    }, 'Đã cập nhật trạng thái thanh toán.');
  }

  async function handleSavePlan(plan, id) {
    await runAction(
      () => saveSubscriptionPlan(session, plan, id),
      id ? 'Đã cập nhật gói đăng ký.' : 'Đã tạo gói đăng ký.',
    );
  }

  async function handleDeletePlan(plan) {
    await runAction(
      () => deleteSubscriptionPlan(session, plan.id),
      'Đã xóa hoặc tắt gói đăng ký.',
    );
  }

  function handleLoadPlan(id) {
    return getSubscriptionPlan(session, id);
  }

  async function handleSaveSkill(skill, id) {
    await runAction(
      () => saveSkill(session, skill, id),
      id ? 'Đã cập nhật skill.' : 'Đã tạo skill.',
    );
  }

  function handleLoadSkill(id) {
    return getSkill(session, id);
  }

  async function handleDeleteSkill(skill) {
    await runAction(() => deleteSkill(session, skill.id), 'Đã xóa hoặc tắt skill.');
  }

  async function handleSaveResource(resource, id) {
    await runAction(
      () => saveLearningResource(session, resource, id),
      id ? 'Đã cập nhật tài nguyên.' : 'Đã tạo tài nguyên.',
    );
  }

  function handleLoadResource(id) {
    return getLearningResource(session, id);
  }

  async function handleUploadResource(resource) {
    await runAction(() => uploadLearningResource(session, resource), 'Đã upload tài nguyên.');
  }

  async function handleDeleteResource(resource) {
    await runAction(() => deleteLearningResource(session, resource.id), 'Đã xóa tài nguyên.');
  }

  async function handleSaveRequirement(requirement, id) {
    await runAction(
      () => saveRoleSkillRequirement(session, requirement, id),
      id ? 'Đã cập nhật requirement.' : 'Đã tạo requirement.',
    );
  }

  function handleLoadRequirement(id) {
    return getRoleSkillRequirement(session, id);
  }

  async function handleDeleteRequirement(requirement) {
    await runAction(() => deleteRoleSkillRequirement(session, requirement.id), 'Đã xóa requirement.');
  }

  async function handleSaveCareerRole(careerRole, id) {
    await runAction(
      () => saveCareerRole(session, careerRole, id),
      id ? 'Đã cập nhật career role.' : 'Đã tạo career role.',
    );
  }

  function handleLoadCareerRole(id) {
    return getCareerRole(session, id);
  }

  async function handleDeleteCareerRole(careerRole) {
    await runAction(() => deleteCareerRole(session, careerRole), 'Đã tắt career role.');
  }

  function renderSection() {
    if (!data) return null;
    if (activeSection === 'users') {
      return (
        <UsersView
          users={data.users}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onToggleStatus={handleToggleUserStatus}
          onDeleteUser={handleDeleteUser}
        />
      );
    }
    if (activeSection === 'payments') {
      return (
        <PaymentsView
          stats={data.stats}
          payments={data.payments}
          subscriptions={data.paymentSubscriptions}
          invoices={data.invoices}
          selectedPayment={selectedPayment}
          onSelectPayment={handleSelectPayment}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
        />
      );
    }
    if (activeSection === 'plans') {
      return <PlansView plans={data.plans} onLoadPlan={handleLoadPlan} onSavePlan={handleSavePlan} onDeletePlan={handleDeletePlan} />;
    }
    if (activeSection === 'skills') {
      return <SkillsView skills={data.skills} onLoadSkill={handleLoadSkill} onSaveSkill={handleSaveSkill} onDeleteSkill={handleDeleteSkill} />;
    }
    if (activeSection === 'resources') {
      return (
        <ResourcesView
          resources={data.learningResources}
          skills={data.skills}
          onLoadResource={handleLoadResource}
          onSaveResource={handleSaveResource}
          onUploadResource={handleUploadResource}
          onDeleteResource={handleDeleteResource}
        />
      );
    }
    if (activeSection === 'requirements') {
      return (
        <RequirementsView
          requirements={data.roleSkillRequirements}
          careerRoles={data.careerRoles}
          skills={data.skills}
          onLoadRequirement={handleLoadRequirement}
          onSaveRequirement={handleSaveRequirement}
          onDeleteRequirement={handleDeleteRequirement}
        />
      );
    }
    if (activeSection === 'careerRoles') {
      return (
        <CareerRolesView
          careerRoles={data.careerRoles}
          onLoadCareerRole={handleLoadCareerRole}
          onSaveCareerRole={handleSaveCareerRole}
          onDeleteCareerRole={handleDeleteCareerRole}
        />
      );
    }
    return <OverviewView stats={data.stats} />;
  }

  return (
    <AdminLayout session={session} activeSection={activeSection} onSectionChange={setActiveSection} onRefresh={refresh} onSignOut={onSignOut}>
      {loading && <div className="state-card">Đang tải dữ liệu admin...</div>}
      {error && <div className="alert">{error}</div>}
      {notice && <div className="success">{notice}</div>}
      {!loading && renderSection()}
    </AdminLayout>
  );
}
