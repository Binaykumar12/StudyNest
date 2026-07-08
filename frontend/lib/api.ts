const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface HealthResponse {
  status: string;
  service: string;
}

export interface SchoolClass {
  id: string;
  name: string;
}

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AuthResponse {
  user: AuthUser;
  message: string;
}

export type DocumentType =
  | "curriculum"
  | "textbook"
  | "teacher_guide"
  | "spec_grid";

export type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";

export interface Subject {
  id: string;
  class_id: string;
  name: string;
}

export interface AdminDocument {
  id: string;
  subject_id: string;
  type: DocumentType;
  file_url: string;
  status: DocumentStatus;
  created_at: string;
}

export interface DocumentStatusSummary {
  subject_id: string;
  total_documents: number;
  uploaded_documents: number;
  processing_documents: number;
  processed_documents: number;
  failed_documents: number;
  ready_to_process: boolean;
  missing_document_types: DocumentType[];
  documents: AdminDocument[];
}

export interface ChapterReview {
  id: string;
  subject_id: string;
  number: number;
  title: string;
  approved: boolean;
  learning_outcomes: string[] | null;
  textbook_content: string | null;
  teacher_notes: string | null;
  diagrams: Array<Record<string, unknown>> | null;
}

export interface AdminAnalytics {
  total_subjects: number;
  uploaded_documents: number;
  processed_documents: number;
  total_chapters: number;
  active_users: number;
}

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload.detail) {
      message = payload.detail;
    } else if (payload.message) {
      message = payload.message;
    }
  } catch {
    // Keep default status-based message if body is empty or not JSON.
  }

  return new ApiError(message, response.status);
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return response.user;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return response.user;
}

export async function logoutUser(): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
  });

  return response.user;
}

export async function createSubject(
  classId: string,
  name: string,
): Promise<Subject> {
  return apiRequest<Subject>("/admin/subjects", {
    method: "POST",
    body: JSON.stringify({ class_id: classId, name }),
  });
}

export async function listSubjects(): Promise<Subject[]> {
  return apiRequest<Subject[]>("/admin/subjects", { method: "GET" });
}

export async function createClass(name: string): Promise<SchoolClass> {
  return apiRequest<SchoolClass>('/admin/classes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function listClasses(): Promise<SchoolClass[]> {
  return apiRequest<SchoolClass[]>('/admin/classes', { method: 'GET' });
}

export async function updateSubject(subjectId: string, name: string): Promise<Subject> {
  return apiRequest<Subject>(`/admin/subjects/${subjectId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  await apiRequest<void>(`/admin/subjects/${subjectId}`, {
    method: "DELETE",
  });
}

export async function uploadAdminDocument(params: {
  subjectId: string;
  documentType: DocumentType;
  file: File;
  replaceExisting?: boolean;
}): Promise<AdminDocument> {
  const formData = new FormData();
  formData.append("subject_id", params.subjectId);
  formData.append("document_type", params.documentType);
  formData.append("replace_existing", String(Boolean(params.replaceExisting)));
  formData.append("file", params.file);

  return apiRequest<AdminDocument>("/admin/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function processSubjectDocuments(subjectId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/admin/documents/process", {
    method: "POST",
    body: JSON.stringify({ subject_id: subjectId }),
  });
}

export async function fetchDocumentStatus(subjectId: string): Promise<DocumentStatusSummary> {
  return apiRequest<DocumentStatusSummary>(`/admin/documents/status?subject_id=${encodeURIComponent(subjectId)}`, {
    method: 'GET',
  });
}

export async function listAdminDocuments(subjectId?: string): Promise<AdminDocument[]> {
  const suffix = subjectId ? `?subject_id=${encodeURIComponent(subjectId)}` : "";
  return apiRequest<AdminDocument[]>(`/admin/documents${suffix}`, {
    method: "GET",
  });
}

export async function listReviewChapters(subjectId?: string): Promise<ChapterReview[]> {
  const suffix = subjectId ? `?subject_id=${encodeURIComponent(subjectId)}` : "";
  return apiRequest<ChapterReview[]>(`/admin/chapters/review${suffix}`, {
    method: "GET",
  });
}

export async function editChapterTitle(chapterId: string, title: string): Promise<ChapterReview> {
  return apiRequest<ChapterReview>(`/admin/chapters/review/${chapterId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

export async function mergeChapters(
  sourceChapterId: string,
  targetChapterId: string,
): Promise<ChapterReview> {
  return apiRequest<ChapterReview>("/admin/chapters/review/merge", {
    method: "POST",
    body: JSON.stringify({ source_chapter_id: sourceChapterId, target_chapter_id: targetChapterId }),
  });
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await apiRequest<void>(`/admin/chapters/review/${chapterId}`, {
    method: "DELETE",
  });
}

export async function approveChapters(chapterIds: string[], approved = true): Promise<{ updated_count: number }> {
  return apiRequest<{ updated_count: number }>("/admin/chapters/approve", {
    method: "POST",
    body: JSON.stringify({ chapter_ids: chapterIds, approved }),
  });
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  return apiRequest<AdminAnalytics>("/admin/analytics", {
    method: "GET",
  });
}

export { API_URL };
