"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, logoutUser } from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function DashboardPage({ currentUser }: WithAuthProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    async function handleLogout() {
        setLogoutError(null);
        setIsLoggingOut(true);

        try {
            await logoutUser();
            router.replace("/login");
        } catch (error) {
            setLogoutError(
                error instanceof ApiError
                    ? error.message
                    : "Unable to logout right now. Please try again.",
            );
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <main className="min-h-screen bg-neutral-50 px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <header className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                        Student Dashboard
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
                        Welcome back, {currentUser.email}
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        Role: <span className="font-medium capitalize">{currentUser.role}</span>
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                    </div>

                    {logoutError ? (
                        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
                            {logoutError}
                        </p>
                    ) : null}
                </header>
            </div>
        </main>
    );
}

export default withAuth(DashboardPage);
