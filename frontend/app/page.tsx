import { HealthStatus } from "@/components/HealthStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-10 shadow-sm">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">
            Phase 0 — Scaffold
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-neutral-900">
            AK Pathshala
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-neutral-600">
            Nepal CDC AI-Powered Learning Platform for Class 9 students and
            teachers.
          </p>
          <HealthStatus />
        </div>
      </div>
    </main>
  );
}
