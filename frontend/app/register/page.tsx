"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { ApiError, registerUser } from "@/lib/api";

interface RegisterFormState {
    email: string;
    password: string;
    confirmPassword: string;
}

interface FieldErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState<RegisterFormState>({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValid = useMemo(() => {
        return (
            EMAIL_REGEX.test(form.email.trim()) &&
            form.password.length >= 8 &&
            form.confirmPassword === form.password
        );
    }, [form.email, form.password, form.confirmPassword]);

    function validateForm(values: RegisterFormState): FieldErrors {
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

        if (!values.confirmPassword) {
            errors.confirmPassword = "Please confirm your password.";
        } else if (values.confirmPassword !== values.password) {
            errors.confirmPassword = "Passwords do not match.";
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
            await registerUser(form.email.trim(), form.password);
            router.push("/dashboard");
        } catch (error) {
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "Unable to create account. Please try again.",
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
                        Create account
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600">
                        Start learning with your CDC materials.
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
                                autoComplete="new-password"
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

                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                Confirm password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        confirmPassword: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                                aria-describedby={
                                    fieldErrors.confirmPassword
                                        ? "confirm-password-error"
                                        : undefined
                                }
                            />
                            {fieldErrors.confirmPassword ? (
                                <p
                                    id="confirm-password-error"
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {fieldErrors.confirmPassword}
                                </p>
                            ) : null}
                        </div>

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
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-neutral-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
