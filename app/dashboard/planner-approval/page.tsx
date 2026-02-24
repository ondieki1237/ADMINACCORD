// This page is only accessible to supervisor@accordmedical.co.ke and accounts@accordmedical.co.ke
import { getSession } from 'next-auth/react';
import SupervisorApprovalPanel from '../../../components/planner-approval/SupervisorApprovalPanel';
import AccountantApprovalPanel from '../../../components/planner-approval/AccountantApprovalPanel';

export default async function PlannerApprovalPage() {
  const session = await getSession();
  const email = session?.user?.email;

  if (!email || (email !== 'supervisor@accordmedical.co.ke' && email !== 'accounts@accordmedical.co.ke')) {
    return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Planner Approval Workflow</h1>
      {email === 'supervisor@accordmedical.co.ke' && <SupervisorApprovalPanel />}
      {email === 'accounts@accordmedical.co.ke' && <AccountantApprovalPanel />}
    </div>
  );
}
