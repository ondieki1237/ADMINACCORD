import React from 'react';
import { apiService } from '@/lib/api';
import useSWR from 'swr';

const fetcher = (plannerId: string) => apiService.getPlannerApprovalStatus(plannerId);

export default function PlannerApprovalStatus({ plannerId }: { plannerId: string }) {
  const { data, error } = useSWR(plannerId ? `planner-status-${plannerId}` : null, () => fetcher(plannerId));

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
    </div>
  );
}
