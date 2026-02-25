import React, { useState } from 'react';
import { apiService } from '@/lib/api';

export default function SupervisorApprovalQuickAction({
  plannerId,
  onApproved,
  status,
}: {
  plannerId: string;
  onApproved?: () => void;
  status?: string;
}) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const sendAction = async (statusType: 'approved' | 'disapproved') => {
    setLoading(true);
    setError(null);
    try {
      await apiService.supervisorPlannerAction(plannerId, statusType, comment || '');
      setComment('');
      setSubmitted(true);
      if (onApproved) onApproved();
    } catch (err: any) {
      // Show backend error message if available
      setError(err.message || 'Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? 'Submitting...' : 'Approve'}
        </button>
        <button
          className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={() => sendAction('disapproved')}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Disapprove'}
        </button>
      </div>
      {error && <div className="text-red-600 mt-1 text-sm">{error}</div>}
    </div>
  );
}
