"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import {
    ApiError,
    createClass,
    createSubject,
    deleteSubject,
    listClasses,
    listSubjects,
    updateSubject,
    type SchoolClass,
    type Subject,
} from "@/lib/api";
import { withAuth, type WithAuthProps } from "@/lib/withAuth";

function SubjectsPage({ currentUser }: WithAuthProps) {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [className, setClassName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectClassId, setSubjectClassId] = useState("");
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [busyAction, setBusyAction] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        const [classList, subjectList] = await Promise.all([listClasses(), listSubjects()]);
        setClasses(classList);
        setSubjects(subjectList);
        if (!subjectClassId && classList.length > 0) {
            setSubjectClassId(classList[0].id);
        }
    }, [subjectClassId]);

    useEffect(() => {
        let active = true;

        async function boot() {
            try {
                await loadData();
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
    }, [loadData]);

    async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!className.trim()) {
            return;
        }

        setBusyAction("class-create");
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await createClass(className.trim());
            setClassName("");
            await loadData();
            setSuccessMessage("Class created.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to create class.");
        } finally {
            setBusyAction(null);
        }
    }

    async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!subjectName.trim() || !subjectClassId) {
            return;
        }

        setBusyAction("subject-create");
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await createSubject(subjectClassId, subjectName.trim());
            setSubjectName("");
            await loadData();
            setSuccessMessage("Subject created.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to create subject.");
        } finally {
            setBusyAction(null);
        }
    }

    async function handleUpdateSubject(subjectId: string) {
        if (!editingName.trim()) {
            return;
        }

        setBusyAction(subjectId);
        setErrorMessage(null);

        try {
            await updateSubject(subjectId, editingName.trim());
            setEditingSubjectId(null);
            setEditingName("");
            await loadData();
            setSuccessMessage("Subject updated.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to update subject.");
        } finally {
            setBusyAction(null);
        }
    }

    async function handleDeleteSubject(subjectId: string) {
        setBusyAction(subjectId);
        setErrorMessage(null);

        try {
            await deleteSubject(subjectId);
            await loadData();
            setSuccessMessage("Subject deleted.");
        } catch (error) {
            setErrorMessage(error instanceof ApiError ? error.message : "Unable to delete subject.");
        } finally {
            setBusyAction(null);
        }
    }

    const classNameById = new Map(classes.map((item) => [item.id, item.name]));

    return (
        <AdminShell
            currentUser={currentUser}
            title="Subject Manager"
            description="Create classes, attach subjects, and keep the CDC catalog aligned before uploads begin."
        >
            <div className="grid gap-4 xl:grid-cols-2">
                <form onSubmit={handleCreateClass} className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Add Class</h3>
                    <input
                        value={className}
                        onChange={(event) => setClassName(event.target.value)}
                        placeholder="e.g. Class 9"
                        className="mt-4 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                    />
                    <button
                        type="submit"
                        disabled={busyAction === "class-create"}
                        className="mt-4 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                    >
                        {busyAction === "class-create" ? "Saving..." : "Create Class"}
                    </button>
                </form>

                <form onSubmit={handleCreateSubject} className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-950">Add Subject</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <select
                            value={subjectClassId}
                            onChange={(event) => setSubjectClassId(event.target.value)}
                            title="Select class for new subject"
                            className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                        >
                            {classes.length === 0 ? (
                                <option value="">Create a class first</option>
                            ) : (
                                classes.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))
                            )}
                        </select>
                        <input
                            value={subjectName}
                            onChange={(event) => setSubjectName(event.target.value)}
                            placeholder="e.g. Science and Technology"
                            className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busyAction === "subject-create" || classes.length === 0}
                        className="mt-4 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-300"
                    >
                        {busyAction === "subject-create" ? "Saving..." : "Create Subject"}
                    </button>
                </form>
            </div>

            {errorMessage ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
            {successMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                        <tr>
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {subjects.map((subject) => {
                            const isEditing = editingSubjectId === subject.id;
                            return (
                                <tr key={subject.id}>
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input
                                                value={editingName}
                                                onChange={(event) => setEditingName(event.target.value)}
                                                placeholder="Subject name"
                                                className="w-full rounded-2xl border border-neutral-300 px-3 py-2 outline-none focus:border-teal-500"
                                            />
                                        ) : (
                                            <div>
                                                <p className="font-medium text-neutral-950">{subject.name}</p>
                                                <p className="text-xs text-neutral-500">{subject.id}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-700">{classNameById.get(subject.class_id) ?? subject.class_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateSubject(subject.id)}
                                                        className="rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingSubjectId(null);
                                                            setEditingName("");
                                                        }}
                                                        className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingSubjectId(subject.id);
                                                            setEditingName(subject.name);
                                                        }}
                                                        className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDeleteSubject(subject.id)}
                                                        disabled={busyAction === subject.id}
                                                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:bg-red-300"
                                                    >
                                                        {busyAction === subject.id ? "Working..." : "Delete"}
                                                    </button>
                                                </>
                                            )}
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

export default withAuth(SubjectsPage, { requiredRole: "admin", unauthorizedRedirectTo: "/dashboard" });