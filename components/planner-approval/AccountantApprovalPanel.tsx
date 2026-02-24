import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AccountantApprovalPanel() {
  const { data: session } = useSession();
  const { data: planners, mutate } = useSWR('/api/planner-approval/pending-accountant', fetcher);
  const [comment, setComment] = useState('');
  const [selectedPlanner, setSelectedPlanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (plannerId: string) => {
    setLoading(true);
    setSelectedPlanner(plannerId);
    await fetch(`/api/planner-approval/accountant/${plannerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
    setComment('');
    setSelectedPlanner(null);
    setLoading(false);
    mutate();
  };

  if (!planners) return <div>Loading planners...</div>;
  if (planners.length === 0) return <div>No planners pending accountant review.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Accountant Review</h2>
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
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
              onClick={() => handleAction(planner._id)}
              disabled={loading && selectedPlanner === planner._id}
            >
              Submit Review
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
