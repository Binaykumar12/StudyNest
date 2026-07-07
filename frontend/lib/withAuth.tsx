"use client";

import { ComponentType, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, getCurrentUser, type AuthUser, type UserRole } from "@/lib/api";

export interface WithAuthProps {
    currentUser: AuthUser;
}

interface WithAuthOptions {
    requiredRole?: UserRole;
    unauthorizedRedirectTo?: string;
}

export function withAuth<P extends WithAuthProps>(
    WrappedComponent: ComponentType<P>,
    options: WithAuthOptions = {},
) {
    const unauthorizedRedirectTo = options.unauthorizedRedirectTo ?? "/dashboard";

    return function ProtectedComponent(props: Omit<P, keyof WithAuthProps>) {
        const router = useRouter();
        const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [errorMessage, setErrorMessage] = useState<string | null>(null);

        useEffect(() => {
            let active = true;

            async function loadCurrentUser() {
                try {
                    const user = await getCurrentUser();
                    if (!active) {
                        return;
                    }
                    if (options.requiredRole && user.role !== options.requiredRole) {
                        router.replace(unauthorizedRedirectTo);
                        return;
                    }
                    setCurrentUser(user);
                    setErrorMessage(null);
                } catch (error) {
                    if (!active) {
                        return;
                    }
                    if (error instanceof ApiError && error.status === 401) {
                        router.replace("/login");
                        return;
                    }
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Unable to verify your session.",
                    );
                } finally {
                    if (active) {
                        setIsLoading(false);
                    }
                }
            }

            void loadCurrentUser();

            return () => {
                active = false;
            };
        }, [router]);

        if (isLoading) {
            return (
                <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
                    <div
                        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
                        role="status"
                        aria-live="polite"
                    >
                        <p className="text-sm font-medium text-neutral-700">
                            Verifying your session...
                        </p>
                    </div>
                </main>
            );
        }

        if (errorMessage) {
            return (
                <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
                    <div
                        className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm"
                        role="alert"
                    >
                        <p className="text-sm font-medium text-red-700">Authentication error</p>
                        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
                    </div>
                </main>
            );
        }

        if (!currentUser) {
            return null;
        }

        return <WrappedComponent {...(props as P)} currentUser={currentUser} />;
    };
}
