import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

// Fetch planners pending supervisor approval
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SupervisorApprovalPanel() {
  const { data: session } = useSession();
  const { data: planners, mutate } = useSWR('/api/planner-approval/pending-supervisor', fetcher);
  const [comment, setComment] = useState('');
  const [selectedPlanner, setSelectedPlanner] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'disapprove' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (plannerId: string, actionType: 'approve' | 'disapprove') => {
    setLoading(true);
    setSelectedPlanner(plannerId);
    setAction(actionType);
    await fetch(`/api/planner-approval/supervisor/${plannerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionType, comment }),
    });
    setComment('');
    setSelectedPlanner(null);
    setAction(null);
    setLoading(false);
    mutate();
  };

  if (!planners) return <div>Loading planners...</div>;
  if (planners.length === 0) return <div>No planners pending approval.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Supervisor Approval</h2>
      <ul className="space-y-6">
        {planners.map((planner: any) => (
          <li key={planner._id} className="border rounded p-4 bg-white shadow">
            <div className="mb-2 font-bold">{planner.userId.firstName} {planner.userId.lastName} ({planner.userId.email})</div>
            <div className="mb-2">Week: {planner.weekRange}</div>
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Add a comment (optional)"
              value={selectedPlanner === planner._id ? comment : ''}
              onChange={e => setComment(e.target.value)}
              disabled={loading && selectedPlanner === planner._id}
            />
            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
                onClick={() => handleAction(planner._id, 'approve')}
                disabled={loading && selectedPlanner === planner._id}
              >
                Approve
              </button>
              <button
                className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
                onClick={() => handleAction(planner._id, 'disapprove')}
                disabled={loading && selectedPlanner === planner._id}
              >
                Disapprove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
