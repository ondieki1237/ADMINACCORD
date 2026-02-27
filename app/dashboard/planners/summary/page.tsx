"use client";

import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import dynamic from 'next/dynamic';

const AccountantSummary = dynamic(
    () => import('@/components/planner-approval/AccountantSummary'),
    { ssr: false }
);

export default function PlannerSummaryPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = authService.getCurrentUserSync();
        setEmail(user?.email ?? null);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6 text-gray-500">Loading...</div>
        );
    }

    const isAccountant = email === 'accounts@accordmedical.co.ke';

    if (!email || !isAccountant) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="p-8 text-center text-red-600 font-bold text-xl">
                    Access Denied
                </div>
                <p className="text-center text-gray-500 mt-2">
                    This page is only accessible to the accountant.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <AccountantSummary />
        </div>
    );
}
