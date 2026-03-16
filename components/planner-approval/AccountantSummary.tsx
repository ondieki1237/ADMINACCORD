"use client";

import React, { useState, useEffect } from 'react';
import {
    fetchAdminPlanners,
    getWeekRange,
    getPreviousWeekRange,
    getNextWeekRange,
    formatWeekRange,
    type Planner
} from '@/lib/plannerHelpers';
import { ArrowLeft, Download, RefreshCw, Calendar, ChevronLeft, ChevronRight, Wallet, Users, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

interface AggregatedUserStats {
    name: string;
    email: string;
    totalAllowance: number;
    approvedPlannersCount: number;
}

export default function AccountantSummary() {
    const router = useRouter();
    const [planners, setPlanners] = useState<Planner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

    // New Feature States
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
    const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() => {
        const d = new Date();
        d.setDate(1); // Start of current month
        return d;
    });
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
    const [callDateStart, setCallDateStart] = useState<string>('');
    const [callDateEnd, setCallDateEnd] = useState<string>('');
    const [callOutcomeFilter, setCallOutcomeFilter] = useState<'all' | 'successful' | 'service'>('all');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('accessToken') || '';
            // Expand the fetch window significantly to ensure we have data for monthly views
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const sixtyDaysAhead = new Date();
            sixtyDaysAhead.setDate(sixtyDaysAhead.getDate() + 60);

            const res = await fetchAdminPlanners({
                token,
                from: ninetyDaysAgo.toISOString(),
                to: sixtyDaysAhead.toISOString(),
                page: 1,
                limit: 2000
            });
            if (res.success && res.data) {
                setPlanners(res.data);
            } else {
                setError('Failed to fetch planners data');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading summary data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const weekRange = getWeekRange(currentWeekStart);

    // Determines if a date falls in the selected analytical period
    const isDateInPeriod = (dateStr: string) => {
        const d = new Date(dateStr);
        if (viewMode === 'weekly') {
            const weekStart = new Date(weekRange.from);
            const weekEnd = new Date(weekRange.to);
            return d >= weekStart && d <= weekEnd;
        } else {
            return d.getFullYear() === currentMonthStart.getFullYear() &&
                d.getMonth() === currentMonthStart.getMonth();
        }
    };

    // Filter only approved planners
    const approvedPlanners = planners.filter((p: any) => p.approval?.status === 'approved');

    // Filter planners falling in the selected period
    const plannersForSelectedPeriod = approvedPlanners.filter(planner => {
        if (!planner.days || planner.days.length === 0) return false;

        // Also apply user filter here if one is selected
        if (selectedUserFilter !== 'all' && planner.userId._id !== selectedUserFilter) {
            return false;
        }

        return planner.days.some(day => {
            if (!day.date) return false;
            return isDateInPeriod(day.date);
        });
    });

    // Extract unique active users across ALL approved planners (for the dropdown)
    const allUsersMap = new Map<string, { id: string, name: string }>();
    approvedPlanners.forEach(p => {
        if (!p.userId || !p.userId._id) return;  // Skip if userId is null
        if (!allUsersMap.has(p.userId._id)) {
            allUsersMap.set(p.userId._id, {
                id: p.userId._id,
                name: `${p.userId.firstName || 'Unknown'} ${p.userId.lastName || ''}`.trim()
            });
        }
    });
    const allUsers = Array.from(allUsersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Aggregate user utilization for the selected period
    const userMap = new Map<string, AggregatedUserStats>();
    let grandTotalAllowance = 0;

    plannersForSelectedPeriod.forEach(planner => {
        if (!planner.userId || !planner.userId._id) return;  // Skip if userId is null
        
        const uId = planner.userId._id;
        if (!userMap.has(uId)) {
            userMap.set(uId, {
                name: `${planner.userId.firstName || 'Unknown'} ${planner.userId.lastName || ''}`.trim(),
                email: planner.userId.email || 'unknown@email.com',
                totalAllowance: 0,
                approvedPlannersCount: 0
            });
        }

        const uStats = userMap.get(uId)!;
        uStats.approvedPlannersCount += 1;

        // Process only days within this period to add up the allowance accurately
        (planner.days || []).forEach(d => {
            if (d.date && isDateInPeriod(d.date)) {
                const dayAllowance = parseFloat(d.allowance) || 0;
                uStats.totalAllowance += dayAllowance;
                grandTotalAllowance += dayAllowance;
            }
        });
    });

    const aggregateUsers = Array.from(userMap.values()).sort((a, b) => b.totalAllowance - a.totalAllowance);

    const periodLabel = viewMode === 'weekly'
        ? formatWeekRange(weekRange.from)
        : currentMonthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const downloadExcel = () => {
        const wb = XLSX.utils.book_new();
        const usernameLabel = selectedUserFilter === 'all' ? 'All_Users' : userMap.get(selectedUserFilter)?.name.replace(/\s+/g, '_') || 'User';
        const outcomeLabel = callOutcomeFilter === 'successful' ? 'Successful_Calls' : callOutcomeFilter === 'service' ? 'Service_Inquiry' : 'All_Calls';

        // 1. Export User Summary
        const exportData = aggregateUsers.map(u => ({
            'Full Name': u.name,
            'Email': u.email,
            'Total Expenditure (KES)': u.totalAllowance,
            'Call Outcome Filter': outcomeLabel
        }));

        const wsUsers = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, wsUsers, `Summary`);

        // 2. Export Daily Expenditures Breakdown with Call Outcome Filter
        const dailyData = [];

        for (const p of plannersForSelectedPeriod) {
            if (!p.days) continue;
            for (const d of p.days) {
                if (d.date && isDateInPeriod(d.date)) {
                    // Apply call date range filter if specified
                    let isWithinDateRange = true;
                    if (callDateStart || callDateEnd) {
                        const dayDate = new Date(d.date);
                        if (callDateStart && dayDate < new Date(callDateStart)) isWithinDateRange = false;
                        if (callDateEnd && dayDate > new Date(callDateEnd)) isWithinDateRange = false;
                    }

                    if (!isWithinDateRange) continue;

                    // Apply call outcome filter (map d.prospects or notes to outcome)
                    let outcomeMatches = true;
                    if (callOutcomeFilter !== 'all') {
                        const prospectText = (d.prospects || '').toLowerCase();
                        const placeText = (d.place || '').toLowerCase();
                        const meansText = (d.means || '').toLowerCase();
                        
                        if (callOutcomeFilter === 'successful') {
                            outcomeMatches = prospectText.includes('successful') || prospectText.includes('closed') || prospectText.includes('converted');
                        } else if (callOutcomeFilter === 'service') {
                            outcomeMatches = prospectText.includes('service') || prospectText.includes('maintenance') || prospectText.includes('repair');
                        }
                    }

                    if (!outcomeMatches) continue;

                    dailyData.push({
                        'Employee Name': `${p.userId.firstName} ${p.userId.lastName}`,
                        'Date': new Date(d.date).toLocaleDateString(),
                        'Location/Place': d.place || 'N/A',
                        'Means of Transport': d.means || 'N/A',
                        'Daily Allowance (KES)': parseFloat(d.allowance) || 0,
                        'Prospects/Notes': d.prospects || '',
                        'Call Outcome': callOutcomeFilter
                    });
                }
            }
        }

        // Sort daily data chronologically
        dailyData.sort((a, b) => new Date(a['Date']).getTime() - new Date(b['Date']).getTime());

        const wsDaily = XLSX.utils.json_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Detailed Log');

        // Generate filename with all filters
        const fileNameSafePeriod = periodLabel.replace(/\s+/g, '_').replace(/,/g, '');
        const dateRangeLabel = (callDateStart || callDateEnd) 
            ? `_${callDateStart || 'Start'}_to_${callDateEnd || 'End'}`
            : '';
        XLSX.writeFile(wb, `Expenditures_${fileNameSafePeriod}_${outcomeLabel}${dateRangeLabel}_${usernameLabel}.xlsx`);
    };

    // Navigation handlers
    const goToPrevious = () => {
        if (viewMode === 'weekly') {
            const { from } = getPreviousWeekRange(currentWeekStart);
            setCurrentWeekStart(new Date(from));
        } else {
            const prevMonth = new Date(currentMonthStart);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            setCurrentMonthStart(prevMonth);
        }
    };

    const goToNext = () => {
        if (viewMode === 'weekly') {
            const { from } = getNextWeekRange(currentWeekStart);
            setCurrentWeekStart(new Date(from));
        } else {
            const nextMonth = new Date(currentMonthStart);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCurrentMonthStart(nextMonth);
        }
    };

    const goToCurrent = () => {
        if (viewMode === 'weekly') {
            setCurrentWeekStart(new Date());
        } else {
            const d = new Date();
            d.setDate(1);
            setCurrentMonthStart(d);
        }
    };

    return (
        <div className="w-full mb-10">
            {/* Header matching planners.tsx branding */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/dashboard/planners')}
                    className="flex items-center space-x-2 text-[#008cf7] hover:text-[#006bb8] transition-colors mb-4 font-medium"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to Weekly Planners</span>
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-[#008cf7] to-[#006bb8] p-3 rounded-xl shadow-lg">
                            <Wallet className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Expenditure Summary</h1>
                            <p className="text-gray-500">Track and export approved financial utilization</p>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-3 bg-white border rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('weekly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly' ? 'bg-[#008cf7] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'monthly' ? 'bg-[#008cf7] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Period Selector */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-[#008cf7]" />
                            <h2 className="text-lg font-bold text-gray-900">
                                {viewMode === 'weekly' ? 'Week Selection' : 'Month Selection'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={goToCurrent}
                                className="text-sm text-[#008cf7] hover:text-[#006bb8] font-medium transition-colors"
                            >
                                Current {viewMode === 'weekly' ? 'Week' : 'Month'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Time Navigation */}
                        <div className="flex items-center justify-between flex-1">
                            <button
                                onClick={goToPrevious}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft className="h-6 w-6 text-gray-600" />
                            </button>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {periodLabel}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {viewMode === 'weekly' ? new Date(weekRange.from).getFullYear() : ''}
                                </div>
                            </div>

                            <button
                                onClick={goToNext}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronRight className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>

                        {/* User Filter Dropdown */}
                        <div className="flex flex-col space-y-1 md:border-l md:pl-6">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Filter className="h-3 w-3" /> Filter by Personnel
                            </label>
                            <select
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#008cf7] focus:border-[#008cf7] text-gray-700 bg-gray-50 max-w-[200px]"
                                value={selectedUserFilter}
                                onChange={(e) => setSelectedUserFilter(e.target.value)}
                            >
                                <option value="all">All Personnel</option>
                                {allUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Total Allowance */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <Wallet className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                        Total {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Expenditure
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold text-gray-900 truncate">
                        KES {grandTotalAllowance.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-green-700 mt-3 pt-3 border-t border-green-200/50">
                        {selectedUserFilter === 'all'
                            ? `From ${aggregateUsers.length} Active Personnel`
                            : `Filtered for 1 specific user`
                        }
                    </div>
                </div>
            </div>

            {/* Call Filters and Export Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                {/* Call Date Range */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                        <Calendar className="h-3 w-3 inline mr-1" />Call Date From
                    </label>
                    <input
                        type="date"
                        value={callDateStart}
                        onChange={(e) => setCallDateStart(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#008cf7] focus:border-[#008cf7] text-gray-700 bg-gray-50"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                        <Calendar className="h-3 w-3 inline mr-1" />Call Date To
                    </label>
                    <input
                        type="date"
                        value={callDateEnd}
                        onChange={(e) => setCallDateEnd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#008cf7] focus:border-[#008cf7] text-gray-700 bg-gray-50"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                        <Filter className="h-3 w-3 inline mr-1" />Call Outcome
                    </label>
                    <select
                        value={callOutcomeFilter}
                        onChange={(e) => setCallOutcomeFilter(e.target.value as 'all' | 'successful' | 'service')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#008cf7] focus:border-[#008cf7] text-gray-700 bg-gray-50"
                    >
                        <option value="all">All Calls</option>
                        <option value="successful">Successful Calls</option>
                        <option value="service">Service Inquiry</option>
                    </select>
                </div>

                {/* Export Button */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-blue-200 p-4 flex flex-col justify-center">
                    <button
                        onClick={downloadExcel}
                        disabled={loading || aggregateUsers.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#008cf7] hover:bg-[#006bb8] text-white font-bold rounded-lg disabled:opacity-50 transition shadow-md w-full"
                    >
                        <Download className="h-5 w-5" />
                        Download Report
                    </button>
                    <p className="text-xs text-gray-600 mt-2 text-center">Export filtered data as Excel</p>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">{error}</div>
            ) : loading ? (
                <div className="flex justify-center items-center h-64 border-2 border-gray-100 rounded-xl bg-white shadow-sm">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#008cf7]" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header for table + Export Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Users className="h-6 w-6 text-[#008cf7]" />
                            <h2 className="text-xl font-bold text-gray-900">Personnel Utilization</h2>
                        </div>
                    </div>

                    {/* User Breakdown Table */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#f8fafd] border-b border-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold text-right">Expenditure (KES)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {aggregateUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-12 text-center text-gray-500 font-medium">
                                                No approved expenditure data found for this {viewMode}.
                                            </td>
                                        </tr>
                                    ) : aggregateUsers.map(u => (
                                        <tr key={u.email} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{u.name}</div>
                                                <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                {u.totalAllowance.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
