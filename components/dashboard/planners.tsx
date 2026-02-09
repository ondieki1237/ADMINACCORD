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
  Car,
  Download
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
import { generatePlannersSummaryPDF, generateIndividualPlannerPDF } from '@/lib/plannerPdfGenerator';

export default function PlannersComponent() {
  const router = useRouter();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const weekRange = getWeekRange(currentWeekStart);
  const uniqueUsers = getUniquePlannerUsers(planners);
  
  // Filter planners by the actual planned week dates (not createdAt)
  const plannersForSelectedWeek = planners.filter(planner => {
    if (!planner.days || planner.days.length === 0) return false;
    
    // Check if any of the planner's days fall within the selected week
    const weekStart = new Date(weekRange.from);
    const weekEnd = new Date(weekRange.to);
    
    return planner.days.some(day => {
      if (!day.date) return false;
      const dayDate = new Date(day.date);
      return dayDate >= weekStart && dayDate <= weekEnd;
    });
  });
  
  const filteredPlanners = selectedUserId 
    ? plannersForSelectedWeek.filter(p => p.userId?._id === selectedUserId)
    : plannersForSelectedWeek;
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

      // Fetch a broader range to allow client-side filtering by planned dates
      // Get 4 weeks before and 4 weeks after to cover planners created early
      const fourWeeksAgo = new Date(currentWeekStart);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const fourWeeksAhead = new Date(currentWeekStart);
      fourWeeksAhead.setDate(fourWeeksAhead.getDate() + 28);
      
      const response = await fetchAdminPlanners({
        token,
        from: fourWeeksAgo.toISOString(),
        to: fourWeeksAhead.toISOString(),
        userId: selectedUserId || undefined,
        sortBy,
        order: sortOrder,
        limit: 500
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

  const handleGenerateSummaryPDF = async () => {
    try {
      setGeneratingPdf(true);
      const adminName = 'Admin'; // You can get this from auth context
      const dateRange = {
        from: new Date(weekRange.from),
        to: new Date(weekRange.to)
      };
      await generatePlannersSummaryPDF(filteredPlanners, dateRange, adminName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateIndividualPDF = async (planner: Planner) => {
    try {
      setGeneratingPdf(true);
      const adminName = 'Admin'; // You can get this from auth context
      const dateRange = {
        from: new Date(weekRange.from),
        to: new Date(weekRange.to)
      };
      await generateIndividualPlannerPDF(planner, dateRange, adminName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate individual PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-[#008cf7] hover:text-[#006bb8] transition-colors mb-4 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-[#008cf7] to-[#006bb8] p-3 rounded-xl shadow-lg">
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
              <Calendar className="h-5 w-5 text-[#008cf7]" />
              <h2 className="text-lg font-bold text-gray-900">Week Selection</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateSummaryPDF}
                disabled={generatingPdf || filteredPlanners.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-md"
                title="Download Summary PDF"
              >
                <Download className="h-4 w-4" />
                <span>Summary PDF</span>
              </button>
              <button
                onClick={goToCurrentWeek}
                className="text-sm text-[#008cf7] hover:text-[#006bb8] font-medium transition-colors"
              >
                Current Week
              </button>
            </div>
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
              className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium bg-white hover:border-gray-300 focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
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
              className="p-2 bg-[#008cf7] text-white rounded-lg hover:bg-[#006bb8] disabled:opacity-50 transition-colors shadow-md"
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
          <RefreshCw className="h-12 w-12 animate-spin text-[#008cf7] mx-auto mb-4" />
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
            
            // Skip planners with null userId
            if (!planner.userId) return null;
            
            return (
              <div key={planner._id} className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                {/* Planner Header */}
                <div className="bg-gradient-to-r from-[#008cf7]/10 to-[#006bb8]/10 border-b-2 border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {planner.userId?.firstName || 'Unknown'} {planner.userId?.lastName || 'User'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {planner.userId?.employeeId || 'N/A'} • {planner.userId?.email || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex items-start space-x-3">
                      <button
                        onClick={() => handleGenerateIndividualPDF(planner)}
                        disabled={generatingPdf}
                        className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium shadow-md"
                        title="Download Individual PDF"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      <div>
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
                  </div>
                  
                  {planner.notes && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-[#008cf7]/20">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-[#008cf7] mt-0.5 flex-shrink-0" />
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
