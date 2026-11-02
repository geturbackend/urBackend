import os from "node:os";
import path from "node:path";

export const CLI_NAME = "ub";

export const CONFIG_DIR = path.join(os.homedir(), ".ub");

export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

/**
 * Default production API base URL.
 * Override via URBACKEND_API_URL env variable for local development.
 */
export const DEFAULT_API_BASE =
  process.env.URBACKEND_API_URL ?? "https://platform-api.urbackend.in";
