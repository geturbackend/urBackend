import { loadWorkspaceConfig, getLocalSchemas } from "../../core/workspace.js";
import { syncSchema } from "../../services/project.service.js";
import { getToken } from "../../core/config.js";
import { APIError } from "../../core/errors.js";
import { logger } from "../../core/logger.js";
import { label } from "../../utils/format.js";

export async function pushCommand(): Promise<void> {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    process.exitCode = 1;
    return;
  }

  const workspaceConfig = loadWorkspaceConfig();
  if (!workspaceConfig || !workspaceConfig.projectId) {
    logger.error(
      "No project linked to this directory. Run 'ub init' to link a project first."
    );
    process.exitCode = 1;
    return;
  }

  const { projectId, projectName } = workspaceConfig;

  // Read all .json files from .ub/schemas/
  const localSchemas = getLocalSchemas();

  if (localSchemas.length === 0) {
    logger.error(
      "No schema files found in .ub/schemas/. Run 'ub pull' first to fetch schemas, or create them manually."
    );
    process.exitCode = 1;
    return;
  }

  // Build the payload from local schema files
  const collections = localSchemas.map((entry) => ({
    name: entry.schema.name ?? entry.name,
    model: entry.schema.model ?? [],
  }));

  logger.info(
    `Pushing ${collections.length} schema(s) to ${projectName ? projectName + " " : ""}(${projectId})...`
  );

  try {
    const result = await syncSchema(projectId, collections);

    logger.success(
      `Successfully synced ${result.synced} collection schema(s) to remote.`
    );
    console.log();
    for (const name of result.collections) {
      console.log(`  ${label("synced")} ${name}`);
    }
    console.log(
      `\nRemote project is now up to date with your local schemas.`
    );
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error(
          "Token is invalid or expired. Run 'ub login' to re-authenticate."
        );
      } else if (error.status === 403) {
        logger.error(error.message || "You do not have permission to sync schemas for this project.");
      } else if (error.status === 400 || error.status === 422) {
        logger.error(`Schema validation failed: ${error.message}`);
      } else {
        logger.error(error.message);
      }
      process.exitCode = 1;
      return;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Unable to connect to the urBackend API. Error: ${errorMessage}`);
    process.exitCode = 1;
  }
}
