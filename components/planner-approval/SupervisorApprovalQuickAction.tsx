import React, { useState } from 'react';

export default function SupervisorApprovalQuickAction({ plannerId, onApproved, status }: { plannerId: string, onApproved?: () => void, status?: string }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sendAction = async (statusType: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const body = JSON.stringify({ status: statusType, comment: comment || '' });
      console.log('Sending approval body:', body);
      await fetch(`http://localhost:4500/api/planner-approval/supervisor/${plannerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body,
      });
      setComment('');
      setSubmitted(true);
      if (onApproved) onApproved();
    } catch (err) {
      setError('Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  // Only show actions if not already approved, or if rejected and user has resubmitted
  if (status === 'approved' || submitted) {
    return <div className="text-green-700 font-semibold mt-2">Review submitted.</div>;
  }

  return (
    <div className="mt-2">
      <textarea
        className="w-full border rounded p-2 mb-2"
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        disabled={loading}
      />
      <div className="flex gap-2">
        <button
          className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={() => sendAction('approved')}
          disabled={loading}
        >
          Approve
        </button>
        <button
          className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={() => sendAction('rejected')}
          disabled={loading}
        >
          Reject
        </button>
      </div>
      {error && <div className="text-red-600 mt-1">{error}</div>}
    </div>
  );
}
