"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  DollarSign, 
  RefreshCw,
  FileText,
  TrendingUp,
  MapPin,
  Car
} from 'lucide-react';
import {
  fetchAdminPlanners,
  getWeekRange,
  getPreviousWeekRange,
  getNextWeekRange,
  calculateWeeklyAllowance,
  calculateTotalAllowance,
  getUniquePlannerUsers,
  formatWeekRange,
  type Planner
} from '@/lib/plannerHelpers';

export default function PlannersComponent() {
  const router = useRouter();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const weekRange = getWeekRange(currentWeekStart);
  const uniqueUsers = getUniquePlannerUsers(planners);
  const filteredPlanners = selectedUserId 
    ? planners.filter(p => p.userId._id === selectedUserId)
    : planners;
  const totalAllowance = calculateTotalAllowance(filteredPlanners);

  const fetchPlanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No auth token found. Please log in.');
        return;
      }

      const range = getWeekRange(currentWeekStart);
      const response = await fetchAdminPlanners({
        token,
        from: range.from,
        to: range.to,
        userId: selectedUserId || undefined,
        sortBy,
        order: sortOrder,
        limit: 100
      });

      if (response.success) {
        setPlanners(response.data);
      } else {
        setError('Failed to fetch planners');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch planners');
      console.error('Error fetching planners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanners();
  }, [currentWeekStart, selectedUserId, sortBy, sortOrder]);

  const goToPreviousWeek = () => {
    const { from } = getPreviousWeekRange(currentWeekStart);
    setCurrentWeekStart(new Date(from));
  };

  const goToNextWeek = () => {
    const { from } = getNextWeekRange(currentWeekStart);
    setCurrentWeekStart(new Date(from));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Planners</h1>
            <p className="text-gray-500">Track field activity plans and allowances</p>
          </div>
        </div>
      </div>

      {/* Week Navigation and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Week Selector */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Week Selection</h2>
            </div>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Current Week
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatWeekRange(weekRange.from)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(weekRange.from).getFullYear()}
              </div>
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Total Allowance */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-sm text-gray-600 mb-1">Total Weekly Allowance</div>
          <div className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 0
            }).format(totalAllowance)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {filteredPlanners.length} planner{filteredPlanners.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* User Filter */}
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-600" />
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium bg-white hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <TrendingUp className={`h-5 w-5 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchPlanners}
              disabled={loading}
              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading planners...</p>
        </div>
      )}

      {/* Planners List */}
      {!loading && filteredPlanners.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Planners Found</h3>
          <p className="text-gray-500">No planners have been created for this week.</p>
        </div>
      )}

      {!loading && filteredPlanners.length > 0 && (
        <div className="space-y-4">
          {filteredPlanners.map((planner) => {
            const weeklyAllowance = calculateWeeklyAllowance(planner);
            
            return (
              <div key={planner._id} className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                {/* Planner Header */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {planner.userId.firstName} {planner.userId.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {planner.userId.employeeId} • {planner.userId.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Weekly Allowance</div>
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0
                        }).format(weeklyAllowance)}
                      </div>
                    </div>
                  </div>
                  
                  {planner.notes && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-purple-100">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{planner.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Days Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {planner.days.map((day, idx) => (
                      <div 
                        key={idx} 
                        className="border-2 border-gray-100 rounded-lg p-4 hover:border-purple-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900">{day.day}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="text-gray-500 text-xs">Place</div>
                              <div className="font-medium text-gray-900">{day.place}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Car className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="text-gray-500 text-xs">Transport</div>
                              <div className="font-medium text-gray-900">{day.means}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="text-gray-500 text-xs">Allowance</div>
                              <div className="font-bold text-green-600">
                                {new Intl.NumberFormat('en-KE', {
                                  style: 'currency',
                                  currency: 'KES',
                                  minimumFractionDigits: 0
                                }).format(parseFloat(day.allowance) || 0)}
                              </div>
                            </div>
                          </div>
                          
                          {day.prospects && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Prospects</div>
                              <div className="text-xs font-medium text-gray-700">{day.prospects}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
