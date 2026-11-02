// @urbackend/cli — Official urBackend CLI

// src/index.ts
import { Command } from "commander";

// package.json
var package_default = {
  name: "@urbackend/cli",
  version: "0.2.3",
  description: "Official CLI for urBackend \u2014 manage projects, schemas, and more from your terminal",
  publishConfig: {
    access: "public"
  },
  type: "module",
  bin: {
    ub: "./bin/ub.js"
  },
  files: [
    "bin",
    "dist",
    "README.md"
  ],
  scripts: {
    build: "tsup --config tsup.config.ts",
    dev: "tsup --config tsup.config.ts --watch",
    lint: "tsc --noEmit",
    format: 'prettier --write "src/**/*.ts"'
  },
  dependencies: {
    commander: "^12.1.0"
  },
  devDependencies: {
    "@types/node": "^22.0.0",
    tsup: "^8.5.1",
    typescript: "^5.7.2"
  },
  engines: {
    node: ">=20.0.0"
  },
  keywords: [
    "urbackend",
    "cli",
    "baas"
  ],
  author: "urBackend Contributors",
  license: "MIT"
};

// src/core/config.ts
import fs from "fs";
import path2 from "path";

// src/core/constants.ts
import os from "os";
import path from "path";
var CONFIG_DIR = path.join(os.homedir(), ".ub");
var CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
var DEFAULT_API_BASE = process.env.URBACKEND_API_URL ?? "https://platform-api.urbackend.in";

// src/core/config.ts
var DEFAULT_CONFIG = {
  apiBase: DEFAULT_API_BASE
};
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return {
      ...DEFAULT_CONFIG,
      ...JSON.parse(raw)
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 448 });
  }
  const tmp = CONFIG_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2), {
    encoding: "utf8",
    mode: 384
  });
  fs.renameSync(tmp, CONFIG_PATH);
  fs.chmodSync(CONFIG_DIR, 448);
  fs.chmodSync(CONFIG_PATH, 384);
}
function saveToken(token) {
  const config = loadConfig();
  const nextConfig = { ...config, pat: token };
  if (config.pat && config.pat !== token) {
    delete nextConfig.currentProject;
  }
  saveConfig(nextConfig);
}
function clearToken() {
  const config = loadConfig();
  delete config.pat;
  delete config.currentProject;
  saveConfig(config);
}
function getToken() {
  return loadConfig().pat;
}
function saveCurrentProject(projectId) {
  const config = loadConfig();
  saveConfig({ ...config, currentProject: projectId });
}
function getCurrentProject() {
  return loadConfig().currentProject;
}
function configFilePath() {
  return CONFIG_PATH;
}

// src/core/errors.ts
var APIError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
  status;
};

// src/core/api.ts
async function apiFetch(endpoint, options = {}) {
  const config = loadConfig();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = options.token ?? config.pat;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const base = config.apiBase.replace(/\/+$/, "");
  const apiPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${base}/api${apiPath}`;
  let response;
  const controller = new AbortController();
  const signal = options.signal ?? controller.signal;
  const timeoutId = options.signal ? void 0 : setTimeout(() => controller.abort(), 15e3);
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal
    });
  } catch (error) {
    throw new APIError(
      0,
      error instanceof Error && error.name === "AbortError" ? "The urBackend API request timed out." : "Unable to connect to the urBackend API. Is the server running?"
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
    }
    throw new APIError(response.status, message);
  }
  if (response.status === 204) {
    return void 0;
  }
  return await response.json();
}

// src/services/auth.service.ts
async function authenticate(token) {
  const res = await apiFetch("/user/cli/me", {
    method: "GET",
    token
  });
  return res.data;
}
async function getProfile() {
  const res = await apiFetch("/user/cli/me", {
    method: "GET"
  });
  return res.data;
}

// src/utils/token.ts
function isValidPAT(token) {
  return typeof token === "string" && /^ubpat_\S{10,}$/.test(token);
}

// src/utils/prompt.ts
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
async function prompt(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer;
}
async function promptSecret(question) {
  const rl = createInterface({
    input: stdin,
    output: stdout
  });
  stdout.write(question);
  const oldWrite = rl._writeToOutput;
  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (stringToWrite === "\r" || stringToWrite === "\n" || stringToWrite === "\r\n") {
      oldWrite.call(rl, stringToWrite);
    } else if (stringToWrite === question) {
      oldWrite.call(rl, stringToWrite);
    } else {
    }
  };
  const answer = (await rl.question("")).trim();
  rl._writeToOutput = oldWrite;
  rl.close();
  return answer;
}
async function confirm(question) {
  const answer = await prompt(`${question} (y/n): `);
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

// src/utils/format.ts
function formatBytes(bytes) {
  if (bytes < 0) return "Unlimited";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${value} ${units[i]}`;
}
function label(text, width = 14) {
  return text.padEnd(width);
}

// src/core/logger.ts
var logger = {
  success(message) {
    console.log(`\u2713 ${message}`);
  },
  error(message) {
    console.error(`\u2716 ${message}`);
  },
  warn(message) {
    console.warn(`\u26A0 ${message}`);
  },
  info(message) {
    console.log(message);
  }
};

// src/commands/auth/login.ts
async function loginCommand() {
  console.log("Generate a Personal Access Token from the urBackend dashboard:");
  console.log("  Settings \u2192 Access Tokens \u2192 New Token\n");
  const token = await promptSecret("Paste your Personal Access Token: ");
  if (!isValidPAT(token)) {
    logger.error(
      "Invalid token format. urBackend PATs start with 'ubpat_' followed by at least 10 characters."
    );
    process.exitCode = 1;
    return;
  }
  try {
    const profile = await authenticate(token);
    try {
      saveToken(token);
    } catch {
      logger.error("Authenticated, but failed to persist the token locally.");
      process.exitCode = 1;
      return;
    }
    logger.success("Logged in successfully.\n");
    console.log(`${label("Email")} ${profile.developer.email}`);
    console.log(`${label("Plan")} ${profile.developer.plan}`);
    if (profile.developer.githubUsername) {
      console.log(`${label("GitHub")} ${profile.developer.githubUsername}`);
    }
    if (profile.auth.scopes.length > 0) {
      console.log(`${label("Scopes")} ${profile.auth.scopes.join(", ")}`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Invalid or expired token. Generate a new one from the dashboard.");
      } else {
        logger.error(error.message);
      }
      process.exitCode = 1;
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
    process.exitCode = 1;
  }
}

// src/commands/auth/logout.ts
async function logoutCommand() {
  clearToken();
  logger.success("Logged out. Your token has been removed from this machine.");
}

// src/commands/auth/whoami.ts
async function whoamiCommand() {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    process.exitCode = 1;
    return;
  }
  try {
    const profile = await getProfile();
    console.log(`${label("Email")} ${profile.developer.email}`);
    console.log(`${label("Plan")} ${profile.developer.plan}`);
    if (profile.developer.githubUsername) {
      console.log(`${label("GitHub")} ${profile.developer.githubUsername}`);
    }
    console.log(`${label("Token type")} ${profile.auth.tokenType}`);
    if (profile.auth.scopes.length > 0) {
      console.log(`${label("Scopes")} ${profile.auth.scopes.join(", ")}`);
    }
    const currentProject = getCurrentProject();
    if (currentProject) {
      console.log(`${label("Project")} ${currentProject}`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else {
        logger.error(error.message);
      }
      process.exitCode = 1;
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
    process.exitCode = 1;
  }
}

// src/services/project.service.ts
async function listProjects() {
  const res = await apiFetch(
    "/projects",
    { method: "GET" }
  );
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}
async function getProject(projectId) {
  const res = await apiFetch(
    `/projects/${projectId}`,
    { method: "GET" }
  );
  if ("data" in res && res.data) return res.data;
  return res;
}
async function syncSchema(projectId, collections) {
  const res = await apiFetch(
    `/projects/${projectId}/sync-schema`,
    {
      method: "PUT",
      body: JSON.stringify({ collections })
    }
  );
  return res.data;
}

// src/commands/project/list.ts
async function projectListCommand() {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  try {
    const projects = await listProjects();
    const currentProjectId = getCurrentProject();
    if (projects.length === 0) {
      logger.info("No projects found. Create one at dashboard.urbackend.bitbros.in");
      return;
    }
    console.log(`
Found ${projects.length} project(s):
`);
    for (const project of projects) {
      const active = project._id === currentProjectId ? " (active)" : "";
      const db = formatBytes(project.databaseUsed ?? 0);
      const colCount = project.collections?.length ?? 0;
      console.log(`  ${project.name}${active}`);
      console.log(`    ID          ${project._id}`);
      console.log(`    Collections ${colCount}`);
      console.log(`    DB used     ${db}`);
      if (project.description) {
        console.log(`    Description ${project.description}`);
      }
      console.log();
    }
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

// src/commands/project/use.ts
async function projectUseCommand(projectIdOrName) {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  try {
    const projects = await listProjects();
    if (projects.length === 0) {
      logger.info("No projects found. Create one at dashboard.urbackend.bitbros.in");
      return;
    }
    let selectedId;
    if (projectIdOrName) {
      const match = projects.find(
        (p) => p._id === projectIdOrName || p.name.toLowerCase() === projectIdOrName.toLowerCase()
      );
      if (!match) {
        logger.error(`No project found matching "${projectIdOrName}".`);
        logger.info("Run 'ub project list' to see available projects.");
        return;
      }
      selectedId = match._id;
    } else {
      console.log("\nAvailable projects:\n");
      projects.forEach((p, i) => {
        console.log(`  [${i + 1}] ${p.name} (${p._id})`);
      });
      console.log();
      const answer = await prompt("Enter project number: ");
      if (!/^\d+$/.test(answer)) {
        logger.error("Invalid selection.");
        return;
      }
      const index = Number(answer) - 1;
      if (isNaN(index) || index < 0 || index >= projects.length) {
        logger.error("Invalid selection.");
        return;
      }
      selectedId = projects[index]._id;
    }
    saveCurrentProject(selectedId);
    const project = projects.find((p) => p._id === selectedId);
    logger.success(`Switched to project: ${project.name} (${selectedId})`);
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

// src/commands/project/info.ts
async function projectInfoCommand(projectId) {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  const id = projectId ?? getCurrentProject();
  if (!id) {
    logger.error("No active project. Run 'ub project use' to select one.");
    return;
  }
  try {
    const project = await getProject(id);
    console.log(`
${project.name}
`);
    console.log(`${label("ID")} ${project._id}`);
    if (project.description) {
      console.log(`${label("Description")} ${project.description}`);
    }
    console.log(`${label("Auth")} ${project.isAuthEnabled ? "Enabled" : "Disabled"}`);
    console.log(`${label("DB used")} ${formatBytes(project.databaseUsed ?? 0)}`);
    console.log(`${label("Storage")} ${formatBytes(project.storageUsed ?? 0)}`);
    console.log(`${label("Collections")} ${project.collections?.length ?? 0}`);
    if (project.collections && project.collections.length > 0) {
      console.log("\nCollections:");
      for (const col of project.collections) {
        const fieldCount = col.model?.length ?? 0;
        console.log(`  \u2022 ${col.name} (${fieldCount} field${fieldCount !== 1 ? "s" : ""})`);
      }
    }
    console.log();
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else if (error.status === 404) {
        logger.error("Project not found.");
      } else {
        logger.error(error.message);
      }
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
  }
}

// src/commands/collection/list.ts
async function collectionListCommand(projectId) {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  const id = projectId ?? getCurrentProject();
  if (!id) {
    logger.error("No active project. Run 'ub project use' to select one.");
    return;
  }
  try {
    const project = await getProject(id);
    const collections = project.collections ?? [];
    if (collections.length === 0) {
      logger.info(`No collections in project "${project.name}".`);
      return;
    }
    console.log(`
Collections in "${project.name}" (${collections.length}):
`);
    for (const col of collections) {
      const fieldCount = col.model?.length ?? 0;
      const rlsMode = col.rls?.enabled ? col.rls.mode : "disabled";
      console.log(`  ${col.name}`);
      console.log(`    ${label("Fields", 10)} ${fieldCount}`);
      console.log(`    ${label("RLS", 10)} ${rlsMode}`);
      if (col.model && col.model.length > 0) {
        const fieldSummary = col.model.slice(0, 5).map((f) => `${f.key}: ${f.type}${f.required ? "*" : ""}`).join(", ");
        const extra = col.model.length > 5 ? ` +${col.model.length - 5} more` : "";
        console.log(`    ${label("Schema", 10)} ${fieldSummary}${extra}`);
      }
      console.log();
    }
    console.log("  * = required field");
    console.log();
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else if (error.status === 404) {
        logger.error("Project not found or access denied.");
      } else {
        logger.error(error.message);
      }
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
  }
}

// src/services/collection.service.ts
async function deleteCollection(projectId, collectionName) {
  const encodedName = encodeURIComponent(collectionName);
  return apiFetch(
    `/projects/${projectId}/collections/${encodedName}`,
    { method: "DELETE" }
  );
}

// src/commands/collection/delete.ts
async function collectionDeleteCommand(collectionName, options) {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  const projectId = options.project ?? getCurrentProject();
  if (!projectId) {
    logger.error("No active project. Run 'ub project use' to select one.");
    return;
  }
  try {
    const project = await getProject(projectId);
    const exists = project.collections?.some((c) => c.name === collectionName);
    if (!exists) {
      logger.error(
        `Collection "${collectionName}" not found in project "${project.name}".`
      );
      return;
    }
    if (!options.force) {
      console.log(
        `
\u26A0  This will permanently delete the collection "${collectionName}" and ALL its data.
`
      );
      const ok = await confirm("Are you sure?");
      if (!ok) {
        logger.info("Aborted.");
        return;
      }
    }
    await deleteCollection(projectId, collectionName);
    logger.success(`Collection "${collectionName}" deleted.`);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else if (error.status === 404) {
        logger.error("Collection or project not found.");
      } else {
        logger.error(error.message);
      }
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
  }
}

// src/services/analytics.service.ts
async function getGlobalStats() {
  const res = await apiFetch("/analytics/stats", {
    method: "GET"
  });
  return res.data;
}
async function getRecentActivity() {
  const res = await apiFetch(
    "/analytics/activity",
    { method: "GET" }
  );
  if (!Array.isArray(res.data)) {
    throw new Error("Invalid response from /analytics/activity");
  }
  return res.data;
}

// src/commands/status/index.ts
function statusIcon(status) {
  if (status < 300) return "\u2713";
  if (status < 400) return "\u2192";
  if (status < 500) return "\u26A0";
  return "\u2716";
}
async function statusCommand() {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    return;
  }
  const currentProjectId = getCurrentProject();
  try {
    const stats = await getGlobalStats();
    console.log("\n\u2500\u2500 Account \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    console.log(`${label("Plan")} ${stats.plan.toUpperCase()}`);
    if (stats.planExpiresAt) {
      console.log(`${label("Plan expires")} ${stats.planExpiresAt}`);
    }
    const fmtLimit = (val, isBytes = false) => {
      if (val === void 0 || val === null) return "N/A";
      if (val === -1) return "Unlimited";
      return isBytes ? formatBytes(val) : val.toLocaleString();
    };
    console.log("\n\u2500\u2500 Usage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    console.log(
      `${label("Projects")} ${stats.usage.totalProjects} / ${fmtLimit(stats.limits.maxProjects)}`
    );
    console.log(
      `${label("Collections")} ${stats.usage.totalCollections} / ${fmtLimit(stats.limits.maxCollections)}`
    );
    console.log(
      `${label("Database")} ${formatBytes(stats.usage.totalDatabaseUsed)} / ${fmtLimit(stats.limits.mongoBytes, true)}`
    );
    console.log(
      `${label("Storage")} ${formatBytes(stats.usage.totalStorageUsed)} / ${fmtLimit(stats.limits.storageBytes, true)}`
    );
    console.log(
      `${label("API requests")} ${stats.usage.totalRequests.toLocaleString()} / ${fmtLimit(stats.limits.reqPerDay)} today`
    );
    console.log(
      `${label("Auth users")} ${stats.usage.totalUsers} / ${fmtLimit(stats.limits.authUsersLimit)}`
    );
    console.log(
      `${label("Webhooks")} ${stats.usage.totalWebhooks} / ${fmtLimit(stats.limits.webhooksLimit)}`
    );
    if (currentProjectId) {
      try {
        const project = await getProject(currentProjectId);
        console.log("\n\u2500\u2500 Active project \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        console.log(`${label("Name")} ${project.name}`);
        console.log(`${label("ID")} ${project._id}`);
        console.log(`${label("Collections")} ${project.collections?.length ?? 0}`);
        console.log(`${label("Auth")} ${project.isAuthEnabled ? "Enabled" : "Disabled"}`);
      } catch {
      }
    } else {
      console.log("\nTip: Run 'ub project use' to select a project.");
    }
    try {
      const activity = await getRecentActivity();
      if (activity.length > 0) {
        console.log("\n\u2500\u2500 Recent activity (last 10) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        for (const log of activity.slice(0, 10)) {
          const icon = statusIcon(log.status);
          const time = new Date(log.timestamp).toLocaleTimeString();
          console.log(
            `  ${icon} [${log.status}] ${log.method.padEnd(6)} ${log.path.padEnd(32)} ${time}`
          );
        }
      }
    } catch {
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

// src/commands/doctor/index.ts
async function checkApiReachable(apiBase) {
  const start = Date.now();
  try {
    const response = await fetch(`${apiBase}/health`, {
      signal: AbortSignal.timeout(5e3)
    });
    if (!response.ok) {
      return null;
    }
    return Date.now() - start;
  } catch {
    return null;
  }
}
async function doctorCommand(options = {}) {
  const config = loadConfig();
  const token = getToken();
  const currentProjectId = getCurrentProject();
  const result = {
    configFound: false,
    patValid: false,
    projectSelected: !!currentProjectId,
    projectAccessible: false,
    dashboardApiReachable: false,
    dashboardApiLatencyMs: null,
    email: null,
    plan: null,
    projectName: null
  };
  try {
    const fs5 = await import("fs");
    result.configFound = fs5.existsSync(configFilePath());
  } catch {
    result.configFound = false;
  }
  const latency = await checkApiReachable(config.apiBase);
  result.dashboardApiReachable = latency !== null;
  result.dashboardApiLatencyMs = latency;
  if (token) {
    try {
      const profile = await getProfile();
      result.patValid = true;
      result.email = profile.developer.email;
      result.plan = profile.developer.plan;
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        result.patValid = false;
      } else {
        result.patValid = null;
      }
    }
  }
  if (currentProjectId && result.patValid) {
    try {
      const project = await getProject(currentProjectId);
      result.projectAccessible = true;
      result.projectName = project.name;
    } catch (error) {
      if (error instanceof APIError && (error.status === 401 || error.status === 403)) {
        result.projectAccessible = false;
      } else {
        result.projectAccessible = null;
      }
    }
  }
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log("\n\u2500\u2500 urBackend CLI Doctor \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
  const ok = "\u2713";
  const fail = "\u2716";
  const warn = "\u26A0";
  console.log(
    `  ${result.configFound ? ok : fail}  Config file           ${result.configFound ? configFilePath() : "Not found \u2014 run 'ub login'"}`
  );
  console.log(
    `  ${result.dashboardApiReachable ? ok : fail}  Dashboard API         ${result.dashboardApiReachable ? `Reachable (${result.dashboardApiLatencyMs}ms)` : `Unreachable \u2014 ${config.apiBase}`}`
  );
  if (!token) {
    console.log(`  ${fail}  PAT                   Not set \u2014 run 'ub login'`);
  } else if (result.patValid === null) {
    console.log(
      `  ${warn}  PAT                   Unable to validate \u2014 API unreachable or backend error`
    );
  } else {
    console.log(
      `  ${result.patValid ? ok : fail}  PAT                   ${result.patValid ? `Valid (${result.email}, ${result.plan})` : "Invalid or expired \u2014 run 'ub login'"}`
    );
  }
  if (!currentProjectId) {
    console.log(`  ${warn}  Active project        Not selected \u2014 run 'ub project use'`);
  } else if (result.projectAccessible === null) {
    console.log(
      `  ${warn}  Active project        Unable to validate \u2014 API unreachable or backend error`
    );
  } else {
    console.log(
      `  ${result.projectAccessible ? ok : fail}  Active project        ${result.projectAccessible ? `${result.projectName} (${currentProjectId})` : `ID ${currentProjectId} \u2014 not found or access denied`}`
    );
  }
  console.log();
  const allGood = result.configFound && result.patValid === true && result.dashboardApiReachable && result.projectSelected && result.projectAccessible === true;
  if (allGood) {
    logger.success("Everything looks good.");
  } else {
    logger.warn("Some checks failed. Review the output above.");
  }
  console.log();
}

// src/commands/init/index.ts
import fs3 from "fs";
import path4 from "path";

// src/core/workspace.ts
import fs2 from "fs";
import path3 from "path";
var WORKSPACE_DIR = ".ub";
var CONFIG_FILE = "config.json";
var SCHEMAS_DIR = "schemas";
function getWorkspaceDir() {
  return path3.join(process.cwd(), WORKSPACE_DIR);
}
function getWorkspaceConfigPath() {
  return path3.join(getWorkspaceDir(), CONFIG_FILE);
}
function getSchemasDir() {
  return path3.join(getWorkspaceDir(), SCHEMAS_DIR);
}
function loadWorkspaceConfig() {
  const configPath = getWorkspaceConfigPath();
  if (!fs2.existsSync(configPath)) {
    return null;
  }
  try {
    const raw = fs2.readFileSync(configPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveWorkspaceConfig(config) {
  const dir = getWorkspaceDir();
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
  const configPath = getWorkspaceConfigPath();
  fs2.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}
function isValidCollectionName(collectionName) {
  return typeof collectionName === "string" && !collectionName.includes("/") && !collectionName.includes("\\") && !collectionName.includes("..");
}
function saveSchemaFile(collectionName, schema) {
  if (!isValidCollectionName(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }
  const schemasDir = getSchemasDir();
  if (!fs2.existsSync(schemasDir)) {
    fs2.mkdirSync(schemasDir, { recursive: true });
  }
  const filePath = path3.join(schemasDir, `${collectionName}.json`);
  fs2.writeFileSync(filePath, JSON.stringify(schema, null, 2), "utf8");
}
function getLocalSchemas() {
  const schemasDir = getSchemasDir();
  if (!fs2.existsSync(schemasDir)) {
    return [];
  }
  const files = fs2.readdirSync(schemasDir).filter((file) => file.endsWith(".json"));
  const schemas = [];
  for (const file of files) {
    try {
      const filePath = path3.join(schemasDir, file);
      const raw = fs2.readFileSync(filePath, "utf8");
      schemas.push({
        name: file.replace(".json", ""),
        schema: JSON.parse(raw)
      });
    } catch (err) {
      logger.warn(`Failed to parse schema file: ${file}. Skipping.`);
    }
  }
  return schemas;
}
function clearSchemaFiles() {
  const schemasDir = getSchemasDir();
  if (!fs2.existsSync(schemasDir)) return;
  const files = fs2.readdirSync(schemasDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      fs2.unlinkSync(path3.join(schemasDir, file));
    }
  }
}

// src/commands/init/index.ts
async function initCommand(projectIdOrName) {
  const token = getToken();
  if (!token) {
    logger.error("You are not logged in. Run 'ub login' first.");
    process.exitCode = 1;
    return;
  }
  try {
    const projects = await listProjects();
    if (projects.length === 0) {
      logger.info("No projects found. Create one at dashboard.urbackend.bitbros.in");
      return;
    }
    let selectedId;
    let selectedName;
    if (projectIdOrName) {
      const match = projects.find(
        (p) => p._id === projectIdOrName || p.name.toLowerCase() === projectIdOrName.toLowerCase()
      );
      if (!match) {
        logger.error(`No project found matching "${projectIdOrName}".`);
        logger.info("Run 'ub project list' to see available projects.");
        process.exitCode = 1;
        return;
      }
      selectedId = match._id;
      selectedName = match.name;
    } else {
      console.log("\nAvailable projects:\n");
      projects.forEach((p, i) => {
        console.log(`  [${i + 1}] ${p.name} (${p._id})`);
      });
      console.log();
      const answer = await prompt("Select a project to link this directory to: ");
      if (!/^\d+$/.test(answer)) {
        logger.error("Invalid selection.");
        process.exitCode = 1;
        return;
      }
      const index = Number(answer) - 1;
      if (isNaN(index) || index < 0 || index >= projects.length) {
        logger.error("Invalid selection.");
        process.exitCode = 1;
        return;
      }
      selectedId = projects[index]._id;
      selectedName = projects[index].name;
    }
    saveWorkspaceConfig({ projectId: selectedId, projectName: selectedName });
    const gitignorePath = path4.join(process.cwd(), ".gitignore");
    if (fs3.existsSync(gitignorePath)) {
      const gitignore = fs3.readFileSync(gitignorePath, "utf8");
      const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
      if (!lines.includes(".ub") && !lines.includes("/.ub") && !lines.includes(".ub/")) {
        fs3.appendFileSync(gitignorePath, "\n# urBackend local workspace\n.ub\n", "utf8");
        logger.info("Added .ub to .gitignore");
      }
    } else {
      fs3.writeFileSync(gitignorePath, "# urBackend local workspace\n.ub\n", "utf8");
      logger.info("Created .gitignore and added .ub");
    }
    logger.success(`Successfully initialized urBackend workspace in .ub/`);
    logger.info(`Linked to project: ${selectedName} (${selectedId})`);
    console.log(`
Next, run 'ub pull' to download your schemas.`);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else {
        logger.error(error.message);
      }
      process.exitCode = 1;
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
    process.exitCode = 1;
  }
}

// src/commands/pull/index.ts
async function pullCommand() {
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
  logger.info(`Fetching schemas for ${projectName ? projectName + " " : ""}(${projectId})...`);
  try {
    const project = await getProject(projectId);
    if (!project.collections || project.collections.length === 0) {
      logger.info("This project has no collections defined yet.");
      return;
    }
    let count = 0;
    for (const collection of project.collections) {
      if (!isValidCollectionName(collection.name)) {
        throw new Error(`Invalid collection name received from remote: ${collection.name}`);
      }
    }
    clearSchemaFiles();
    for (const collection of project.collections) {
      saveSchemaFile(collection.name, {
        name: collection.name,
        model: collection.model,
        rls: collection.rls
      });
      count++;
    }
    logger.success(`Successfully pulled ${count} collection schema(s) into .ub/schemas/`);
    console.log();
    for (const collection of project.collections) {
      console.log(`  ${label("schema")} ${collection.name}.json`);
    }
    console.log(`
Next, run 'ub generate' to create your TypeScript types.`);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 401) {
        logger.error("Token is invalid or expired. Run 'ub login' to re-authenticate.");
      } else if (error.status === 403) {
        logger.error("You do not have permission to access this project.");
      } else {
        logger.error(error.message);
      }
      process.exitCode = 1;
      return;
    }
    logger.error("Unable to connect to the urBackend API.");
    process.exitCode = 1;
  }
}

// src/commands/push/index.ts
async function pushCommand() {
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
  const localSchemas = getLocalSchemas();
  if (localSchemas.length === 0) {
    logger.error(
      "No schema files found in .ub/schemas/. Run 'ub pull' first to fetch schemas, or create them manually."
    );
    process.exitCode = 1;
    return;
  }
  const collections = localSchemas.map((entry) => ({
    name: entry.schema.name ?? entry.name,
    model: entry.schema.model ?? []
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
      `
Remote project is now up to date with your local schemas.`
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

// src/commands/generate/index.ts
import fs4 from "fs";
import path5 from "path";
function mapType(field, indent = "    ") {
  switch (field.type) {
    case "String":
      return "string";
    case "Number":
      return "number";
    case "Boolean":
      return "boolean";
    case "Date":
      return "string | Date";
    case "Ref":
      return "string";
    case "Array":
      if (field.fields && field.fields.length > 0) {
        if (field.fields.length === 1 && !field.fields[0].key) {
          return `Array<${mapType(field.fields[0], indent)}>`;
        }
        return `Array<${parseFields(field.fields, indent + "  ")}>`;
      }
      return "any[]";
    case "Object":
      if (field.fields && field.fields.length > 0) {
        return parseFields(field.fields, indent + "  ");
      }
      return "Record<string, any>";
    default:
      return "any";
  }
}
function parseFields(fields, indent) {
  let out = "{\n";
  for (const f of fields) {
    const isOptional = !f.required ? "?" : "";
    const typeStr = mapType(f, indent);
    out += `${indent}  "${f.key}"${isOptional}: ${typeStr};
`;
  }
  out += `${indent}}`;
  return out;
}
async function generateCommand() {
  const schemas = getLocalSchemas();
  if (schemas.length === 0) {
    logger.error("No schemas found in .ub/schemas/. Run 'ub pull' first.");
    process.exitCode = 1;
    return;
  }
  let dtsContent = `// Auto-generated by urBackend CLI
// Do not edit this file directly

`;
  dtsContent += `export interface UrBackendTypes {
`;
  for (const { name, schema } of schemas) {
    if (!schema.model || !Array.isArray(schema.model)) continue;
    dtsContent += `  "${name}": {
`;
    dtsContent += `    _id: string;
`;
    for (const field of schema.model) {
      const isOptional = !field.required ? "?" : "";
      const typeStr = mapType(field, "  ");
      dtsContent += `    "${field.key}"${isOptional}: ${typeStr};
`;
    }
    dtsContent += `    createdAt: string | Date;
`;
    dtsContent += `    updatedAt: string | Date;
`;
    dtsContent += `  };
`;
  }
  dtsContent += `}
`;
  const outputPath = path5.join(process.cwd(), "urbackend.d.ts");
  try {
    fs4.writeFileSync(outputPath, dtsContent, "utf8");
    logger.success(`Generated TypeScript definitions at ./urbackend.d.ts`);
  } catch (error) {
    logger.error(`Failed to write urbackend.d.ts: ${error.message}`);
    process.exitCode = 1;
  }
}

// src/index.ts
var program = new Command();
var CLI_VERSION = package_default.version;
program.name("ub").description("Official urBackend CLI \u2014 manage projects, schemas, and more").version(CLI_VERSION, "-V, --version", "Output the current version").option("-v", "Output the current version");
program.on("option:v", () => {
  console.log(CLI_VERSION);
  process.exit(0);
});
program.command("login").description("Authenticate with a Personal Access Token").action(loginCommand);
program.command("logout").description("Remove stored credentials from this machine").action(logoutCommand);
program.command("whoami").description("Show the currently authenticated developer").action(whoamiCommand);
var projectCmd = program.command("project").description("Manage urBackend projects");
projectCmd.command("list").alias("ls").description("List all accessible projects").action(projectListCommand);
projectCmd.command("use [projectIdOrName]").description("Set the active project for subsequent commands").action(projectUseCommand);
projectCmd.command("info [projectId]").description("Show details for the active (or specified) project").action(projectInfoCommand);
var collectionCmd = program.command("collection").alias("col").description("Manage collections inside the active project");
collectionCmd.command("list").alias("ls").description("List all collections in the active project").option("-p, --project <projectId>", "Target a specific project ID").action((options) => collectionListCommand(options.project));
collectionCmd.command("delete <collectionName>").alias("rm").description("Delete a collection and all its data").option("-f, --force", "Skip confirmation prompt").option("-p, --project <projectId>", "Target a specific project ID").action((name, options) => collectionDeleteCommand(name, options));
program.command("status").description("Show account usage and recent API activity").action(statusCommand);
program.command("doctor").description("Run diagnostic checks on your CLI setup").option("--json", "Output results as JSON (useful for CI/AI agents)").action((options) => doctorCommand(options));
program.command("init [projectIdOrName]").description("Initialize a local urBackend project workspace").action((projectIdOrName) => initCommand(typeof projectIdOrName === "string" ? projectIdOrName : void 0));
program.command("pull").description("Fetch the latest schemas for the linked project").action(pullCommand);
program.command("push").description("Push local schemas to the remote project").action(pushCommand);
program.command("generate").description("Generate TypeScript definitions from local schemas").action(generateCommand);
program.parseAsync(process.argv).catch((err) => {
  console.error(`\u2716 ${err.message}`);
  process.exit(1);
});
//# sourceMappingURL=index.js.map