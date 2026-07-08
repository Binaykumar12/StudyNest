"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { fetchAdminAnalytics, type AdminAnalytics, type AuthUser } from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function AdminHomePage({ currentUser }: WithAuthProps) {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadAnalytics() {
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

        void loadAnalytics();

        return () => {
            active = false;
        };
    }, []);

    return (
        <AdminShell
            currentUser={currentUser}
            title="Overview"
            description="Launch points for the CDC upload and review workflow."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Subjects", value: analytics?.total_subjects ?? "-" },
                    { label: "Uploaded Docs", value: analytics?.uploaded_documents ?? "-" },
                    { label: "Processed Docs", value: analytics?.processed_documents ?? "-" },
                    { label: "Chapters", value: analytics?.total_chapters ?? "-" },
                ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                        <p className="text-sm text-neutral-500">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{item.value}</p>
                    </div>
                ))}
            </div>

            {errorMessage ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
                {[
                    ["Subjects", "/admin/subjects", "Create classes and assign subjects."],
                    ["Upload", "/admin/upload", "Upload the four CDC PDFs for a subject."],
                    ["Review", "/admin/review", "Edit, merge, and approve extracted chapters."],
                    ["Status", "/admin/status", "Track document processing progress."],
                    ["Analytics", "/admin/analytics", "View the basic usage dashboard."],
                ].map(([label, href, description]) => (
                    <Link
                        key={href}
                        href={href}
                        className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Quick link</p>
                        <h3 className="mt-3 text-xl font-semibold text-neutral-950">{label}</h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
                    </Link>
                ))}
            </div>
        </AdminShell>
    );
}

export default withAuth(AdminHomePage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });