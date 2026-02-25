"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface Planner {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  weekRange?: string;
  weekCreatedAt?: string;
}

export default function SupervisorApprovalPanel() {
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [comment, setComment] = useState('');
  const [selectedPlanner, setSelectedPlanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const fetchPending = async () => {
    setFetchLoading(true);
    setError(null);
    try {
      const data = await apiService.getPendingSupervisorPlanners();
      setPlanners(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending planners.');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (plannerId: string, statusType: 'approved' | 'disapproved') => {
    setLoading(true);
    setSelectedPlanner(plannerId);
    setActionError(null);
    try {
      await apiService.supervisorPlannerAction(plannerId, statusType, comment);
      setComment('');
      setSelectedPlanner(null);
      // Immediately hide this row to prevent double-clicks
      setSubmittedIds(prev => new Set(prev).add(plannerId));
      fetchPending();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit action.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="py-4 text-gray-500">Loading pending planners...</div>;
  if (error) return <div className="py-4 text-red-600">{error}</div>;

  const visiblePlanners = planners.filter(p => !submittedIds.has(p._id));
  if (visiblePlanners.length === 0) return <div className="py-4 text-gray-500">No planners pending supervisor approval.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Supervisor Approval</h2>
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{actionError}</div>
      )}
      <ul className="space-y-6">
        {visiblePlanners.map((planner) => (
          <li key={planner._id} className="border rounded p-4 bg-white shadow">
            <div className="mb-2 font-bold">
              {planner.userId.firstName} {planner.userId.lastName}{' '}
              <span className="font-normal text-gray-500">({planner.userId.email})</span>
            </div>
            {planner.weekRange && (
              <div className="mb-2 text-sm text-gray-600">Week: {planner.weekRange}</div>
            )}
            {planner.weekCreatedAt && !planner.weekRange && (
              <div className="mb-2 text-sm text-gray-600">
                Week starting: {new Date(planner.weekCreatedAt).toLocaleDateString()}
              </div>
            )}
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Add a comment (optional)"
              value={selectedPlanner === planner._id ? comment : ''}
              onChange={e => {
                setSelectedPlanner(planner._id);
                setComment(e.target.value);
              }}
              disabled={loading && selectedPlanner === planner._id}
            />
            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
                onClick={() => handleAction(planner._id, 'approved')}
                disabled={loading && selectedPlanner === planner._id}
              >
                {loading && selectedPlanner === planner._id ? 'Submitting...' : 'Approve'}
              </button>
              <button
                className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
                onClick={() => handleAction(planner._id, 'disapproved')}
                disabled={loading && selectedPlanner === planner._id}
              >
                {loading && selectedPlanner === planner._id ? 'Submitting...' : 'Disapprove'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
