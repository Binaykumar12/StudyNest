"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import {
    ApiError,
    approveChapters,
    deleteChapter,
    editChapterTitle,
    listReviewChapters,
    listSubjects,
    mergeChapters,
    type ChapterReview,
    type Subject,
} from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function ReviewPage({ currentUser }: WithAuthProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [chapters, setChapters] = useState<ChapterReview[]>([]);
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
    const [editingTitles, setEditingTitles] = useState<Record<string, string>>({});
    const [mergeSourceId, setMergeSourceId] = useState("");
    const [mergeTargetId, setMergeTargetId] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadData = useCallback(async (subjectId: string) => {
        const [subjectList, chapterList] = await Promise.all([
            listSubjects(),
            subjectId ? listReviewChapters(subjectId) : Promise.resolve([]),
        ]);
        setSubjects(subjectList);
        setChapters(chapterList);
        setSelectedChapterIds([]);
        setEditingTitles(
            Object.fromEntries(chapterList.map((chapter) => [chapter.id, chapter.title])),
        );
        if (!selectedSubjectId && subjectList.length > 0) {
            setSelectedSubjectId(subjectList[0].id);
        }
    }, [selectedSubjectId]);

    useEffect(() => {
        let active = true;

        async function boot() {
            try {
                await loadData(selectedSubjectId);
            } catch (error) {
                if (active) {
                    setErrorMessage(error instanceof Error ? error.message : "Unable to load review screen.");
                }
            }
        }

        void boot();

        return () => {
            active = false;
        };
    }, [loadData, selectedSubjectId]);

    const selectedCount = selectedChapterIds.length;

    const chapterOptions = useMemo(
        () => chapters.map((chapter) => ({ id: chapter.id, label: `Chapter ${chapter.number}: ${chapter.title}` })),
        [chapters],
    );

    async function handleSaveTitle(chapterId: string) {
        const nextTitle = editingTitles[chapterId]?.trim();
        if (!nextTitle) {
            return;
        }

        setBusyId(chapterId);
        setMessage(null);
        setErrorMessage(null);

        try {
            await editChapterTitle(chapterId, nextTitle);
            await loadData(selectedSubjectId);
            setMessage("Chapter title updated.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to update chapter title.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleDeleteChapter(chapterId: string) {
        setBusyId(chapterId);
        setMessage(null);
        setErrorMessage(null);

        try {
            await deleteChapter(chapterId);
            await loadData(selectedSubjectId);
            setMessage("Chapter deleted.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to delete chapter.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleMerge() {
        if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
            return;
        }

        setBusyId("merge");
        setMessage(null);
        setErrorMessage(null);

        try {
            await mergeChapters(mergeSourceId, mergeTargetId);
            await loadData(selectedSubjectId);
            setMessage("Chapters merged.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to merge chapters.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleApproval(approved: boolean) {
        if (selectedChapterIds.length === 0) {
            return;
        }

        setBusyId(approved ? "approve" : "unapprove");
        setMessage(null);
        setErrorMessage(null);

        try {
            await approveChapters(selectedChapterIds, approved);
            await loadData(selectedSubjectId);
            setMessage(approved ? "Selected chapters approved." : "Selected chapters unapproved.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to update approval state.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <AdminShell
            currentUser={currentUser}
            title="Chapter Review"
            description="Refine detected chapters, merge split fragments, and approve content for student visibility."
        >
            <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                    <div>
                        <label className="text-sm font-medium text-neutral-700">Subject</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(event) => setSelectedSubjectId(event.target.value)}
                            title="Select subject for review"
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
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-700">Merge source</label>
                        <select
                            value={mergeSourceId}
                            onChange={(event) => setMergeSourceId(event.target.value)}
                            title="Select source chapter to merge"
                            className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                        >
                            <option value="">Choose source</option>
                            {chapterOptions.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>
                                    {chapter.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-700">Merge target</label>
                        <select
                            value={mergeTargetId}
                            onChange={(event) => setMergeTargetId(event.target.value)}
                            title="Select target chapter to merge into"
                            className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                        >
                            <option value="">Choose target</option>
                            {chapterOptions.map((chapter) => (
                                <option key={chapter.id} value={chapter.id}>
                                    {chapter.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void handleMerge()}
                        disabled={busyId === "merge"}
                        className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white disabled:bg-neutral-300"
                    >
                        {busyId === "merge" ? "Merging..." : "Merge Selected Pair"}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleApproval(true)}
                        disabled={selectedCount === 0 || busyId === "approve"}
                        className="rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:bg-teal-300"
                    >
                        {busyId === "approve" ? "Approving..." : `Approve Selected (${selectedCount})`}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleApproval(false)}
                        disabled={selectedCount === 0 || busyId === "unapprove"}
                        className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 disabled:bg-neutral-50"
                    >
                        {busyId === "unapprove" ? "Updating..." : `Unapprove Selected (${selectedCount})`}
                    </button>
                </div>
            </div>

            {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
            {errorMessage ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                        <tr>
                            <th className="px-6 py-4">Select</th>
                            <th className="px-6 py-4">Number</th>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Preview</th>
                            <th className="px-6 py-4">Approved</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {chapters.map((chapter) => {
                            const isSelected = selectedChapterIds.includes(chapter.id);
                            return (
                                <tr key={chapter.id}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            title={`Select chapter ${chapter.number}`}
                                            checked={isSelected}
                                            onChange={(event) => {
                                                setSelectedChapterIds((current) =>
                                                    event.target.checked
                                                        ? [...current, chapter.id]
                                                        : current.filter((id) => id !== chapter.id),
                                                );
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-neutral-950">{chapter.number}</td>
                                    <td className="px-6 py-4">
                                        <input
                                            value={editingTitles[chapter.id] ?? chapter.title}
                                            onChange={(event) =>
                                                setEditingTitles((current) => ({ ...current, [chapter.id]: event.target.value }))
                                            }
                                            placeholder="Edit chapter title"
                                            className="w-full rounded-2xl border border-neutral-300 px-3 py-2 outline-none focus:border-teal-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600">
                                        {(chapter.textbook_content ?? chapter.learning_outcomes?.join(" • ") ?? "No preview available").slice(0, 140)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chapter.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {chapter.approved ? "Approved" : "Review"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleSaveTitle(chapter.id)}
                                                disabled={busyId === chapter.id}
                                                className="rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:bg-teal-300"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteChapter(chapter.id)}
                                                disabled={busyId === chapter.id}
                                                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AdminShell>
    );
}

export default withAuth(ReviewPage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });