"use client";

import React from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { authService } from '@/lib/auth';
import { apiService } from '@/lib/api';

const SupervisorApprovalQuickAction = dynamic(
  () => import('./SupervisorApprovalQuickAction'),
  { ssr: false }
);

const fetcher = (plannerId: string) => apiService.getPlannerApprovalStatus(plannerId);

export default function PlannerApprovalStatusWithAction({ plannerId }: { plannerId: string }) {
  const { data, error, mutate } = useSWR(
    plannerId ? `planner-approval-${plannerId}` : null,
    () => fetcher(plannerId),
    { refreshInterval: 30000 }
  );

  const currentUser = authService.getCurrentUserSync();
  const userEmail = currentUser?.email ?? '';
  const isSupervisor = userEmail === 'supervisor@accordmedical.co.ke';
  const isAccountant = userEmail === 'accounts@accordmedical.co.ke';

  // Backend always returns a status — never 404. Any error here is a real failure.
  if (error) {
    return (
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h3 className="font-semibold mb-1">Approval Status</h3>
        <div className="text-red-600 text-sm">{error.message || 'Failed to load approval status.'}</div>
      </div>
    );
  }

  if (!data) return <div className="text-gray-500 text-sm mt-2">Loading approval status...</div>;

  // status is one of: pending | approved | disapproved
  const status: string = data.status ?? 'pending';

  const statusColor =
    status === 'approved' ? 'text-green-600' :
      status === 'disapproved' ? 'text-red-600' :
        'text-yellow-600';

  return (
    <div className="border rounded p-4 bg-gray-50 mt-4">
      <h3 className="font-semibold mb-2">Approval Status</h3>
      <div>
        Status: <span className={`font-bold capitalize ${statusColor}`}>{status}</span>
      </div>

      {data.supervisor && (
        <div className="mt-2 text-sm">
          <div className="font-semibold">Supervisor Review:</div>
          {data.supervisor.action && <div>Action: <span className="capitalize">{data.supervisor.action}</span></div>}
          {data.supervisor.comment && <div>Comment: {data.supervisor.comment}</div>}
        </div>
      )}

      {data.accountant && (
        <div className="mt-2 text-sm">
          <div className="font-semibold">Accountant Review:</div>
          {data.accountant.comment && <div>Comment: {data.accountant.comment}</div>}
        </div>
      )}

      {/* Supervisor: show actions while not yet reviewed */}
      {isSupervisor && !data.supervisor && (
        <SupervisorApprovalQuickAction plannerId={plannerId} onApproved={mutate} status={status} />
      )}

      {/* Accountant: can only act after supervisor approval */}
      {isAccountant && status === 'approved' && !data.accountant && (
        <AccountantQuickAction plannerId={plannerId} onDone={mutate} />
      )}

      {isAccountant && status !== 'approved' && (
        <div className="mt-2 text-gray-500 text-sm">Awaiting supervisor approval before accountant action.</div>
      )}
    </div>
  );
}

function AccountantQuickAction({ plannerId, onDone }: { plannerId: string; onDone?: () => void }) {
  const [comment, setComment] = React.useState('');
  const [allowance, setAllowance] = React.useState<number | ''>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return <div className="text-blue-700 font-semibold mt-2">Accountant review submitted.</div>;
  }

  const handleAction = async (statusType: 'approved' | 'disapproved') => {
    setLoading(true);
    setError(null);
    try {
      await apiService.accountantPlannerReview(
        plannerId,
        statusType,
        allowance === '' ? 0 : Number(allowance),
        comment || ''
      );
      setSubmitted(true);
      if (onDone) onDone();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 text-sm">
      <div className="mb-2">
        <label className="block font-medium text-gray-700 mb-1">Total Allowance (KES)</label>
        <input
          type="number"
          className="w-full border rounded p-2 mb-2"
          placeholder="e.g. 5000"
          value={allowance}
          onChange={e => setAllowance(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={loading}
        />

        <label className="block font-medium text-gray-700 mb-1">Comments</label>
        <textarea
          className="w-full border rounded p-2 mb-2"
          placeholder="Add an accountant comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex gap-2">
        <button
          className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={() => handleAction('approved')}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Approve'}
        </button>
        <button
          className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={() => handleAction('disapproved')}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Disapprove'}
        </button>
      </div>
      {error && <div className="text-red-600 mt-1">{error}</div>}
    </div>
  );
}
