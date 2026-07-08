"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AuthUser } from "@/lib/api";

const NAV_ITEMS = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/subjects", label: "Subjects" },
    { href: "/admin/upload", label: "Upload" },
    { href: "/admin/status", label: "Processing Status" },
    { href: "/admin/review", label: "Chapter Review" },
    { href: "/admin/analytics", label: "Analytics" },
];

interface AdminShellProps {
    currentUser: AuthUser;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function AdminShell({ currentUser, title, description, children }: AdminShellProps) {
    const pathname = usePathname();

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl gap-6">
                <aside className="hidden w-72 shrink-0 flex-col justify-between rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:flex">
                    <div>
                        <div className="rounded-2xl bg-neutral-950 px-4 py-4 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
                                AK Pathshala
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                                Admin Console
                            </h1>
                            <p className="mt-2 text-sm text-neutral-300">
                                Class 9 CDC pipeline management.
                            </p>
                        </div>

                        <nav className="mt-6 space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive =
                                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive
                                            ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                        <p className="font-medium text-neutral-900">Signed in as</p>
                        <p className="mt-1 break-words">{currentUser.email}</p>
                        <p className="mt-1 capitalize">Role: {currentUser.role}</p>
                    </div>
                </aside>

                <section className="flex-1 space-y-6">
                    <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                                    Admin Dashboard
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
                                    {title}
                                </h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 sm:text-base">
                                    {description}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-sm">
                                {NAV_ITEMS.slice(1).map((item) => {
                                    const isActive =
                                        pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`rounded-full px-4 py-2 font-medium transition ${isActive
                                                ? "bg-neutral-950 text-white"
                                                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </header>

                    {children}
                </section>
            </div>
        </main>
    );
}