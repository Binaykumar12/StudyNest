"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { fetchDocumentStatus, listSubjects, type DocumentStatusSummary, type Subject } from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function StatusPage({ currentUser }: WithAuthProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [status, setStatus] = useState<DocumentStatusSummary | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function boot() {
            try {
                const subjectList = await listSubjects();
                if (!active) {
                    return;
                }
                setSubjects(subjectList);
                if (!selectedSubjectId && subjectList.length > 0) {
                    setSelectedSubjectId(subjectList[0].id);
                }
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load subjects.");
                }
            }
        }

        void boot();

        return () => {
            active = false;
        };
    }, [selectedSubjectId]);

    useEffect(() => {
        if (!selectedSubjectId) {
            setStatus(null);
            return;
        }

        let active = true;
        let timer: ReturnType<typeof setInterval> | null = null;

        async function refresh() {
            try {
                const nextStatus = await fetchDocumentStatus(selectedSubjectId);
                if (!active) {
                    return;
                }
                setStatus(nextStatus);

                if (nextStatus.processing_documents > 0 && !timer) {
                    timer = setInterval(() => {
                        void refresh().catch(() => undefined);
                    }, 3000);
                } else if (nextStatus.processing_documents === 0 && timer) {
                    clearInterval(timer);
                    timer = null;
                }
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load status.");
                }
            }
        }

        void refresh();

        return () => {
            active = false;
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [selectedSubjectId]);

    const selectedSubject = subjects.find((item) => item.id === selectedSubjectId) ?? null;

    return (
        <AdminShell
            currentUser={currentUser}
            title="Processing Status"
            description="Monitor each uploaded CDC document, refresh the pipeline state, and see which files are ready for extraction."
        >
            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <label className="text-sm font-medium text-neutral-700">Subject</label>
                    <select
                        value={selectedSubjectId}
                        onChange={(event) => setSelectedSubjectId(event.target.value)}
                        title="Select subject for processing status"
                        className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                    >
                        {subjects.length === 0 ? (
                            <option value="">Create a subject first</option>
                        ) : (
                            subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))
                        )}
                    </select>

                    {errorMessage ? (
                        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </p>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => {
                            if (selectedSubjectId) {
                                void fetchDocumentStatus(selectedSubjectId)
                                    .then(setStatus)
                                    .catch((error: unknown) => {
                                        setErrorMessage(error instanceof Error ? error.message : "Unable to refresh status.");
                                    });
                            }
                        }}
                        className="mt-4 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    >
                        Refresh Now
                    </button>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    {status ? (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-neutral-500">Selected subject</p>
                                    <p className="text-xl font-semibold text-neutral-950">{selectedSubject?.name ?? status.subject_id}</p>
                                </div>
                                <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                                    {status.ready_to_process ? "Ready to process" : "Waiting for uploads"}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ["Total", status.total_documents],
                                    ["Uploaded", status.uploaded_documents],
                                    ["Processing", status.processing_documents],
                                    ["Processed", status.processed_documents],
                                ].map(([label, value]) => (
                                    <div key={label as string} className="rounded-2xl bg-neutral-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-neutral-500">{label as string}</p>
                                        <p className="mt-2 text-2xl font-semibold text-neutral-950">{String(value)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-600">
                                Missing document types: {status.missing_document_types.length > 0 ? status.missing_document_types.join(", ") : "None"}
                            </div>

                            <div className="space-y-3">
                                {status.documents.map((document) => (
                                    <div key={document.id} className="rounded-2xl border border-neutral-200 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-neutral-950">{document.type}</p>
                                                <p className="text-xs text-neutral-500">{document.created_at}</p>
                                            </div>
                                            <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                                                {document.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-sm text-neutral-500">
                            Select a subject to load its processing status.
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}

export default withAuth(StatusPage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });