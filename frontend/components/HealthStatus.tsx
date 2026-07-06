"use client";

import { useEffect, useState } from "react";

import { fetchHealth, type HealthResponse } from "@/lib/api";

type StatusState = "loading" | "success" | "error";

export function HealthStatus() {
  const [state, setState] = useState<StatusState>("loading");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const data = await fetchHealth();
        if (!cancelled) {
          setHealth(data);
          setState("success");
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div
        className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600"
        role="status"
        aria-live="polite"
      >
        Checking backend connection…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        <p className="font-medium">Backend unreachable</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <p className="font-medium">Backend connected</p>
      <dl className="mt-2 space-y-1 font-mono text-xs">
        <div className="flex gap-2">
          <dt className="text-neutral-500">status:</dt>
          <dd>{health?.status}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-neutral-500">service:</dt>
          <dd>{health?.service}</dd>
        </div>
      </dl>
    </div>
  );
}
