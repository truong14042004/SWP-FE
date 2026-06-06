import { useEffect, useState } from 'react';
import '../../styles/admin.css';
import { AdminLayout } from './components/AdminLayout';
import {
  createCounselorAssignment,
  deleteAdminUser,
  deleteCounselorAssignment,
  enableCounselorAssignment,
  deleteSubscriptionPlan,
  getAdminUser,
  getPayment,
  getSubscriptionPlan,
  loadAdminDashboard,
  saveAdminUser,
  saveSubscriptionPlan,
  updatePaymentStatus,
  updateUserStatus,
  uploadAdminUserAvatar,
} from './adminApi';
import { OverviewView } from './views/OverviewView';
import { UsersView } from './views/UsersView';
import { PaymentsView } from './views/PaymentsView';
import { PlansView } from './views/PlansView';
import { AssignmentsView } from './views/AssignmentsView';
import { MarketPulseAdminView } from './views/MarketPulseAdminView';

const VALID_SECTIONS = new Set([
  'overview', 'users', 'assignments', 'payments', 'plans', 'marketPulse',
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
      case 'marketPulse':
        return <MarketPulseAdminView session={session} />;
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
