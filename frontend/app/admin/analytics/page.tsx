"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { fetchAdminAnalytics, type AdminAnalytics } from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function AnalyticsPage({ currentUser }: WithAuthProps) {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await fetchAdminAnalytics();
                if (active) {
                    setAnalytics(data);
                }
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load analytics.");
                }
            }
        }

        void load();

        return () => {
            active = false;
        };
    }, []);

    return (
        <AdminShell
            currentUser={currentUser}
            title="Analytics"
            description="Basic usage counters for the admin workflow."
        >
            {errorMessage ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    ["Subjects", analytics?.total_subjects ?? "-"],
                    ["Uploaded documents", analytics?.uploaded_documents ?? "-"],
                    ["Processed documents", analytics?.processed_documents ?? "-"],
                    ["Chapters", analytics?.total_chapters ?? "-"],
                ].map(([label, value]) => (
                    <div key={label as string} className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                        <p className="text-sm text-neutral-500">{label as string}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{String(value)}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-950">Admin Notes</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                    User management and richer analytics remain outside the Phase 2 scope. This page is kept intentionally simple as a launch stub.
                </p>
            </div>
        </AdminShell>
    );
}

export default withAuth(AnalyticsPage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });