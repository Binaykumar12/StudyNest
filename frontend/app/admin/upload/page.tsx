"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import {
    ApiError,
    fetchDocumentStatus,
    listSubjects,
    processSubjectDocuments,
    uploadAdminDocument,
    type DocumentStatusSummary,
    type DocumentType,
    type Subject,
} from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string }> = [
    { value: "curriculum", label: "Curriculum" },
    { value: "textbook", label: "Textbook" },
    { value: "teacher_guide", label: "Teacher Guide" },
    { value: "spec_grid", label: "Specification Grid" },
];

function UploadPage({ currentUser }: WithAuthProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [filesByType, setFilesByType] = useState<Record<DocumentType, File | null>>({
        curriculum: null,
        textbook: null,
        teacher_guide: null,
        spec_grid: null,
    });
    const [status, setStatus] = useState<DocumentStatusSummary | null>(null);
    const [busyType, setBusyType] = useState<DocumentType | "process" | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedSubject = useMemo(
        () => subjects.find((item) => item.id === selectedSubjectId) ?? null,
        [selectedSubjectId, subjects],
    );

    const loadSubjects = useCallback(async () => {
        const subjectList = await listSubjects();
        setSubjects(subjectList);
        if (!selectedSubjectId && subjectList.length > 0) {
            setSelectedSubjectId(subjectList[0].id);
        }
    }, [selectedSubjectId]);

    const loadStatus = useCallback(async (subjectId: string) => {
        const nextStatus = await fetchDocumentStatus(subjectId);
        setStatus(nextStatus);
    }, []);

    useEffect(() => {
        let active = true;

        async function boot() {
            try {
                await loadSubjects();
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load upload screen.");
                }
            }
        }

        void boot();

        return () => {
            active = false;
        };
    }, [loadSubjects]);

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

                if (nextStatus.processing_documents > 0) {
                    if (!timer) {
                        timer = setInterval(() => {
                            void loadStatus(selectedSubjectId).catch(() => undefined);
                        }, 3500);
                    }
                } else if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load processing status.");
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
    }, [loadStatus, selectedSubjectId]);

    async function handleUpload(documentType: DocumentType) {
        const file = filesByType[documentType];
        if (!selectedSubjectId || !file) {
            return;
        }

        setBusyType(documentType);
        setMessage(null);
        setErrorMessage(null);

        try {
            await uploadAdminDocument({
                subjectId: selectedSubjectId,
                documentType,
                file,
                replaceExisting: true,
            });
            setMessage(`${DOCUMENT_TYPES.find((item) => item.value === documentType)?.label} uploaded.`);
            setFilesByType((current) => ({ ...current, [documentType]: null }));
            await loadStatus(selectedSubjectId);
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to upload document.");
        } finally {
            setBusyType(null);
        }
    }

    async function handleProcess(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selectedSubjectId) {
            return;
        }

        setBusyType("process");
        setMessage(null);
        setErrorMessage(null);

        try {
            const response = await processSubjectDocuments(selectedSubjectId);
            setMessage(response.message);
            await loadStatus(selectedSubjectId);
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to start processing.");
        } finally {
            setBusyType(null);
        }
    }

    return (
        <AdminShell
            currentUser={currentUser}
            title="Upload Documents"
            description="Upload the four CDC PDFs for a subject, then start the extraction pipeline."
        >
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <label className="text-sm font-medium text-neutral-700">Subject</label>
                    <select
                        value={selectedSubjectId}
                        onChange={(event) => setSelectedSubjectId(event.target.value)}
                        title="Select subject for upload"
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

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {DOCUMENT_TYPES.map((item) => (
                            <div key={item.value} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    title={`Upload ${item.label}`}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        setFilesByType((current) => ({ ...current, [item.value]: file }));
                                    }}
                                    className="mt-3 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleUpload(item.value)}
                                    disabled={!filesByType[item.value] || busyType === item.value || !selectedSubjectId}
                                    className="mt-4 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white disabled:bg-neutral-300"
                                >
                                    {busyType === item.value ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleProcess} className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={busyType === "process" || !selectedSubjectId}
                            className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
                        >
                            {busyType === "process" ? "Processing..." : "Process Subject"}
                        </button>
                        <button
                            type="button"
                            onClick={() => selectedSubjectId && void loadStatus(selectedSubjectId)}
                            className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
                        >
                            Refresh Status
                        </button>
                    </form>

                    {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
                    {errorMessage ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
                </div>

                <div className="space-y-4 rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Current Status</h3>
                    <p className="text-sm text-neutral-600">
                        {selectedSubject ? `${selectedSubject.name} is selected.` : "Select a subject to load document status."}
                    </p>

                    {status ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ["Ready", status.ready_to_process ? "Yes" : "No"],
                                    ["Uploaded", String(status.uploaded_documents)],
                                    ["Processing", String(status.processing_documents)],
                                    ["Processed", String(status.processed_documents)],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-2xl bg-neutral-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
                                        <p className="mt-2 text-xl font-semibold text-neutral-950">{value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-neutral-200 p-4">
                                <p className="text-sm font-medium text-neutral-700">Missing document types</p>
                                <p className="mt-2 text-sm text-neutral-600">
                                    {status.missing_document_types.length > 0
                                        ? status.missing_document_types.join(", ")
                                        : "None"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {status.documents.map((document) => (
                                    <div key={document.id} className="rounded-2xl border border-neutral-200 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-neutral-950">{document.type}</p>
                                                <p className="text-xs text-neutral-500 break-all">{document.file_url}</p>
                                            </div>
                                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                                                {document.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                            Status will appear here after a subject is selected.
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}

export default withAuth(UploadPage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });