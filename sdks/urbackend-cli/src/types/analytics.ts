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
