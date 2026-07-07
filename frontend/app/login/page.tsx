"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { ApiError, loginUser } from "@/lib/api";

interface LoginFormState {
    email: string;
    password: string;
    rememberMe: boolean;
}

interface FieldErrors {
    email?: string;
    password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState<LoginFormState>({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = useMemo(() => {
        return EMAIL_REGEX.test(form.email.trim()) && form.password.length >= 8;
    }, [form.email, form.password]);

    function validateForm(values: LoginFormState): FieldErrors {
        const errors: FieldErrors = {};

        if (!values.email.trim()) {
            errors.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(values.email.trim())) {
            errors.email = "Enter a valid email address.";
        }

        if (!values.password) {
            errors.password = "Password is required.";
        } else if (values.password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        }

        return errors;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const errors = validateForm(form);
        setFieldErrors(errors);
        setFormError(null);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await loginUser(form.email.trim(), form.password);
            router.push("/dashboard");
        } catch (error) {
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Unable to sign in. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-neutral-50 px-6 py-12">
            <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
                <section className="w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-10">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                        AK Pathshala
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
                        Sign in
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        Continue your CDC learning journey.
                    </p>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, email: event.target.value }))
                                }
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            />
                            {fieldErrors.email ? (
                                <p id="email-error" className="mt-1 text-sm text-red-600">
                                    {fieldErrors.email}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, password: event.target.value }))
                                }
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                aria-describedby={
                                    fieldErrors.password ? "password-error" : undefined
                                }
                            />
                            {fieldErrors.password ? (
                                <p id="password-error" className="mt-1 text-sm text-red-600">
                                    {fieldErrors.password}
                                </p>
                            ) : null}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-neutral-700">
                            <input
                                type="checkbox"
                                checked={form.rememberMe}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        rememberMe: event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                            />
                            Remember me
                        </label>

                        {formError ? (
                            <p className="text-sm text-red-600" role="alert" aria-live="polite">
                                {formError}
                            </p>
                        ) : null}

                        <button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-neutral-400"
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-neutral-600">
                        New to AK Pathshala?{" "}
                        <Link href="/register" className="font-medium text-primary hover:underline">
                            Create your account
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
