import { getGlobalStats, getRecentActivity } from "../../services/analytics.service.js";
import { getProject } from "../../services/project.service.js";
import { getToken, getCurrentProject } from "../../core/config.js";
import { formatBytes, label } from "../../utils/format.js";
import { APIError } from "../../core/errors.js";
import { logger } from "../../core/logger.js";

function statusIcon(status: number): string {
  if (status < 300) return "✓";
  if (status < 400) return "→";
  if (status < 500) return "⚠";
  return "✖";
}

export async function statusCommand(): Promise<void> {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }

  const currentProjectId = getCurrentProject();

  try {
    const stats = await getGlobalStats();

    console.log("\n── Account ─────────────────────────────────────");
    console.log(`${label("Plan")} ${stats.plan.toUpperCase()}`);

    if (stats.planExpiresAt) {
      console.log(`${label("Plan expires")} ${stats.planExpiresAt}`);
    }

    const fmtLimit = (val: number | undefined, isBytes = false): string => {
      if (val === undefined || val === null) return "N/A";
      if (val === -1) return "Unlimited";
      return isBytes ? formatBytes(val) : val.toLocaleString();
    };

    console.log("\n── Usage ────────────────────────────────────────");
    console.log(
      `${label("Projects")} ${stats.usage.totalProjects} / ${fmtLimit(stats.limits.maxProjects)}`,
    );
    console.log(
      `${label("Collections")} ${stats.usage.totalCollections} / ${fmtLimit(stats.limits.maxCollections)}`,
    );
    console.log(
      `${label("Database")} ${formatBytes(stats.usage.totalDatabaseUsed)} / ${fmtLimit(stats.limits.mongoBytes, true)}`,
    );
    console.log(
      `${label("Storage")} ${formatBytes(stats.usage.totalStorageUsed)} / ${fmtLimit(stats.limits.storageBytes, true)}`,
    );
    console.log(
      `${label("API requests")} ${stats.usage.totalRequests.toLocaleString()} / ${fmtLimit(stats.limits.reqPerDay)} today`,
    );
    console.log(
      `${label("Auth users")} ${stats.usage.totalUsers} / ${fmtLimit(stats.limits.authUsersLimit)}`,
    );
    console.log(
      `${label("Webhooks")} ${stats.usage.totalWebhooks} / ${fmtLimit(stats.limits.webhooksLimit)}`,
    );

    if (currentProjectId) {
      try {
        const project = await getProject(currentProjectId);
        console.log("\n── Active project ───────────────────────────────");
        console.log(`${label("Name")} ${project.name}`);
        console.log(`${label("ID")} ${project._id}`);
        console.log(`${label("Collections")} ${project.collections?.length ?? 0}`);
        console.log(`${label("Auth")} ${project.isAuthEnabled ? "Enabled" : "Disabled"}`);
      } catch {
        // non-fatal
      }
    } else {
      console.log("\nTip: Run 'ub project use' to select a project.");
    }

    try {
      const activity = await getRecentActivity();
      if (activity.length > 0) {
        console.log("\n── Recent activity (last 10) ────────────────────");
        for (const log of activity.slice(0, 10)) {
          const icon = statusIcon(log.status);
          const time = new Date(log.timestamp).toLocaleTimeString();
          console.log(
            `  ${icon} [${log.status}] ${log.method.padEnd(6)} ${log.path.padEnd(32)} ${time}`,
          );
        }
      }
    } catch {
      // non-fatal
    }

    console.log();
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else {
        logger.error(error.message);
      }
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
  }
}