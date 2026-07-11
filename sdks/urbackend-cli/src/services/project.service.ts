import { apiFetch } from "../core/api.js";
import type { Project, ProjectListItem } from "../types/project.js";

interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const res = await apiFetch<ProjectListItem[] | APIResponse<ProjectListItem[]>>(
    "/projects",
    { method: "GET" },
  );
  // Backend returns raw array, not wrapped in { data: [...] }
  if (Array.isArray(res)) return res;
  return (res as APIResponse<ProjectListItem[]>).data ?? [];
}

export async function getProject(projectId: string): Promise<Project> {
  const res = await apiFetch<Project | APIResponse<Project>>(
    `/projects/${projectId}`,
    { method: "GET" },
  );
  if ("data" in res && res.data) return (res as APIResponse<Project>).data;
  return res as Project;
}

export async function createProject(payload: {
  name: string;
  description?: string;
}): Promise<Project> {
  const res = await apiFetch<Project | APIResponse<Project>>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if ("data" in res && res.data) return (res as APIResponse<Project>).data;
  return res as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export interface SyncSchemaResult {
  synced: number;
  collections: string[];
}

export async function syncSchema(
  projectId: string,
  collections: { name: string; model: any[] }[],
): Promise<SyncSchemaResult> {
  const res = await apiFetch<APIResponse<SyncSchemaResult>>(
    `/projects/${projectId}/sync-schema`,
    {
      method: "PUT",
      body: JSON.stringify({ collections }),
    },
  );
  return res.data;
}