import React from 'react';
import useSWR from 'swr';
import SupervisorApprovalQuickAction from './SupervisorApprovalQuickAction';

const fetcher = async (url: string) => {
  // Rewrite to use backend port 4500 and send Authorization header
  const apiUrl = url.replace(/^\/api\//, 'http://localhost:4500/api/');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(apiUrl, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const error: any = new Error('Error fetching approval status');
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function PlannerApprovalStatusWithAction({ plannerId }: { plannerId: string }) {
  const { data, error, mutate } = useSWR(`/api/planner-approval/${plannerId}`, fetcher, { refreshInterval: 30000 });

  // If 404, show review UI (no approval record yet)
  if (error && error.status === 404) {
    return (
      <div className="border rounded p-4 bg-gray-50 mt-4">
        <h3 className="font-semibold mb-2">Approval Status</h3>
        <div>Status: <span className="font-bold text-yellow-600">Not reviewed</span></div>
        <SupervisorApprovalQuickAction plannerId={plannerId} onApproved={mutate} status={"pending"} />
      </div>
    );
  }

  if (error) return <div className="text-red-600">Failed to load approval status.</div>;
  if (!data) return <div>Loading approval status...</div>;

  return (
    <div className="border rounded p-4 bg-gray-50 mt-4">
      <h3 className="font-semibold mb-2">Approval Status</h3>
      <div>Status: <span className="font-bold">{data.status}</span></div>
      {data.supervisor && (
        <div className="mt-2">
          <div className="font-semibold">Supervisor:</div>
          <div>Action: {data.supervisor.action}</div>
          <div>Comment: {data.supervisor.comment}</div>
        </div>
      )}
      {data.accountant && (
        <div className="mt-2">
          <div className="font-semibold">Accountant:</div>
          <div>Comment: {data.accountant.comment}</div>
        </div>
      )}
      {(data.status !== 'approved') && (
        <SupervisorApprovalQuickAction plannerId={plannerId} onApproved={mutate} status={data.status} />
      )}
    </div>
  );
}
