import { apiFetch } from "../core/api.js";

interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface GlobalStats {
  plan: string;
  planExpiresAt: string | null;
  limits: {
    maxProjects: number;
    maxCollections: number;
    reqPerDay: number;
    storageBytes: number;
    mongoBytes: number;
    authUsersLimit: number;
    webhooksLimit: number;
  };
  usage: {
    totalProjects: number;
    totalCollections: number;
    totalStorageUsed: number;
    totalDatabaseUsed: number;
    totalRequests: number;
    totalWebhooks: number;
    totalUsers: number;
  };
}

export interface RecentActivityLog {
  id: string;
  projectName: string;
  projectId: string;
  method: string;
  path: string;
  status: number;
  timestamp: string;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const res = await apiFetch<APIResponse<GlobalStats>>("/analytics/stats", {
    method: "GET",
  });
  return res.data;
}

export async function getRecentActivity(): Promise<RecentActivityLog[]> {
  const res = await apiFetch<APIResponse<RecentActivityLog[]>>(
    "/analytics/activity",
    { method: "GET" },
  );
  if (!Array.isArray(res.data)) {
    throw new Error("Invalid response from /analytics/activity");
  }
  return res.data;
}
