import { useEffect, useState } from 'react';
import '../../styles/admin.css';
import { AdminLayout } from './components/AdminLayout';
import {
  createCounselorAssignment,
  deleteAdminUser,
  deleteCareerRole,
  deleteCounselorAssignment,
  enableCounselorAssignment,
  deleteLearningResource,
  deleteRoleSkillRequirement,
  deleteSkillPrerequisite,
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
  saveAdminUser,
  saveCareerRole,
  saveLearningResource,
  saveRoleSkillRequirement,
  saveSkillPrerequisite,
  saveSkill,
  saveSubscriptionPlan,
  updatePaymentStatus,
  updateUserStatus,
  uploadAdminUserAvatar,
} from './adminApi';
import { OverviewView } from './views/OverviewView';
import { UsersView } from './views/UsersView';
import { PaymentsView } from './views/PaymentsView';
import { PlansView } from './views/PlansView';
import { SkillsView } from './views/SkillsView';
import { ResourcesView } from './views/ResourcesView';
import { RequirementsView } from './views/RequirementsView';
import { CareerRolesView } from './views/CareerRolesView';
import { AssignmentsView } from './views/AssignmentsView';
import { MarketPulseAdminView } from './views/MarketPulseAdminView';
import { PrerequisitesView } from './views/PrerequisitesView';
import { AutoEvolveView } from './views/AutoEvolveView';

const VALID_SECTIONS = new Set([
  'overview', 'users', 'assignments', 'payments', 'plans',
  'skills', 'resources', 'requirements', 'prerequisites', 'careerRoles', 'marketPulse', 'autoEvolve',
]);

function readHashSection() {
  const hash = (window.location.hash || '').replace(/^#/, '');
  return VALID_SECTIONS.has(hash) ? hash : 'overview';
}

export function AdminDashboard({ session, onSignOut }) {
  const [activeSection, setActiveSection] = useState(readHashSection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeSection && activeSection !== 'overview') {
      window.history.replaceState(null, '', `#${activeSection}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeSection]);

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
      if (successMessage) setNotice(successMessage);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSelectUser(id) {
    setError('');
    setNotice('');
    try {
      const user = await getAdminUser(session, id);
      setSelectedUser(user);
      return user;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    }
  }

  async function handleToggleUserStatus(user) {
    await runAction(
      () => updateUserStatus(session, user.id, !user.isActive),
      user.isActive ? 'User has been deactivated.' : 'User has been activated.',
    );
  }

  async function handleSaveUser(user, id) {
    setError('');
    setNotice('');
    try {
      const savedUser = await saveAdminUser(session, user, id);
      setSelectedUser(savedUser);
      setNotice(id ? 'User updated.' : 'User created.');
      await refresh();
      return savedUser;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleUploadUserAvatar(userId, file) {
    setError('');
    setNotice('');
    try {
      const updatedUser = await uploadAdminUserAvatar(session, userId, file);
      setSelectedUser(updatedUser);
      setNotice('Avatar uploaded.');
      await refresh();
      return updatedUser;
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function handleDeleteUser(user) {
    await runAction(async () => {
      await deleteAdminUser(session, user.id);
      setSelectedUser(null);
    }, 'User has been permanently deleted.');
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
    }, 'Payment status updated.');
  }

  async function handleSavePlan(plan, id) {
    await runAction(
      () => saveSubscriptionPlan(session, plan, id),
      id ? 'Plan updated.' : 'Plan created.',
    );
  }

  async function handleDeletePlan(plan) {
    await runAction(
      () => deleteSubscriptionPlan(session, plan.id),
      'Plan removed or disabled.',
    );
  }

  function handleLoadPlan(id) { return getSubscriptionPlan(session, id); }

  async function handleSaveSkill(skill, id) {
    await runAction(() => saveSkill(session, skill, id), id ? 'Skill updated.' : 'Skill created.');
  }
  function handleLoadSkill(id) { return getSkill(session, id); }
  async function handleDeleteSkill(skill) {
    await runAction(() => deleteSkill(session, skill.id), 'Skill removed or disabled.');
  }

  async function handleSaveResource(resource, id) {
    await runAction(
      () => saveLearningResource(session, resource, id),
      id ? 'Resource updated.' : 'Resource created.',
    );
  }
  function handleLoadResource(id) { return getLearningResource(session, id); }
  async function handleDeleteResource(resource) {
    await runAction(() => deleteLearningResource(session, resource.id), 'Resource removed.');
  }

  async function handleSaveRequirement(requirement, id) {
    await runAction(
      () => saveRoleSkillRequirement(session, requirement, id),
      id ? 'Requirement updated.' : 'Requirement created.',
    );
  }
  function handleLoadRequirement(id) { return getRoleSkillRequirement(session, id); }
  async function handleDeleteRequirement(requirement) {
    await runAction(() => deleteRoleSkillRequirement(session, requirement.id), 'Requirement removed.');
  }

  async function handleSavePrerequisite(prerequisite) {
    await runAction(() => saveSkillPrerequisite(session, prerequisite), 'Prerequisite created.');
  }
  async function handleDeletePrerequisite(prerequisite) {
    await runAction(() => deleteSkillPrerequisite(session, prerequisite.id), 'Prerequisite removed.');
  }

  async function handleSaveCareerRole(careerRole, id) {
    await runAction(
      () => saveCareerRole(session, careerRole, id),
      id ? 'Career role updated.' : 'Career role created.',
    );
  }
  function handleLoadCareerRole(id) { return getCareerRole(session, id); }
  async function handleDeleteCareerRole(careerRole) {
    await runAction(() => deleteCareerRole(session, careerRole), 'Career role disabled.');
  }

  async function handleCreateAssignment(payload) {
    await runAction(() => createCounselorAssignment(session, payload), 'Assignment created.');
  }
  async function handleDeleteAssignment(assignment) {
    await runAction(() => deleteCounselorAssignment(session, assignment.id), 'Assignment ended.');
  }
  async function handleEnableAssignment(assignment) {
    await runAction(() => enableCounselorAssignment(session, assignment.id), 'Assignment re-activated.');
  }

  function renderSection() {
    if (!data) return null;

    switch (activeSection) {
      case 'users':
        return (
          <UsersView
            users={data.users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onSaveUser={handleSaveUser}
            onUploadAvatar={handleUploadUserAvatar}
            onToggleStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'assignments':
        return (
          <AssignmentsView
            assignments={data.assignments}
            users={data.users}
            onCreate={handleCreateAssignment}
            onDelete={handleDeleteAssignment}
            onEnable={handleEnableAssignment}
          />
        );
      case 'payments':
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
      case 'plans':
        return (
          <PlansView
            plans={data.plans}
            onLoadPlan={handleLoadPlan}
            onSavePlan={handleSavePlan}
            onDeletePlan={handleDeletePlan}
          />
        );
      case 'skills':
        return (
          <SkillsView
            skills={data.skills}
            onLoadSkill={handleLoadSkill}
            onSaveSkill={handleSaveSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        );
      case 'resources':
        return (
          <ResourcesView
            resources={data.learningResources}
            skills={data.skills}
            onLoadResource={handleLoadResource}
            onSaveResource={handleSaveResource}
            onDeleteResource={handleDeleteResource}
          />
        );
      case 'requirements':
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
      case 'prerequisites':
        return (
          <PrerequisitesView
            prerequisites={data.skillPrerequisites}
            skills={data.skills}
            onSavePrerequisite={handleSavePrerequisite}
            onDeletePrerequisite={handleDeletePrerequisite}
          />
        );
      case 'careerRoles':
        return (
          <CareerRolesView
            careerRoles={data.careerRoles}
            onLoadCareerRole={handleLoadCareerRole}
            onSaveCareerRole={handleSaveCareerRole}
            onDeleteCareerRole={handleDeleteCareerRole}
          />
        );
      case 'marketPulse':
        return <MarketPulseAdminView session={session} />;
      case 'autoEvolve':
        return <AutoEvolveView session={session} />;
      default:
        return <OverviewView stats={data.stats} session={session} />;
    }
  }

  return (
    <AdminLayout
      session={session}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onRefresh={refresh}
      onSignOut={onSignOut}
    >
      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}
      {loading && !data && <div className="empty-state">Loading dashboard…</div>}
      {!loading && renderSection()}
    </AdminLayout>
  );
}
