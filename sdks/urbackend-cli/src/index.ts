import { Command } from "commander";
import { loginCommand } from "./commands/auth/login.js";
import { logoutCommand } from "./commands/auth/logout.js";
import { whoamiCommand } from "./commands/auth/whoami.js";
import { projectListCommand } from "./commands/project/list.js";
import { projectUseCommand } from "./commands/project/use.js";
import { projectInfoCommand } from "./commands/project/info.js";
import { collectionListCommand } from "./commands/collection/list.js";
import { collectionDeleteCommand } from "./commands/collection/delete.js";
import { statusCommand } from "./commands/status/index.js";
import { doctorCommand } from "./commands/doctor/index.js";
import { initCommand } from "./commands/init/index.js";
import { pullCommand } from "./commands/pull/index.js";
import { pushCommand } from "./commands/push/index.js";
import { generateCommand } from "./commands/generate/index.js";

const program = new Command();

program
  .name("ub")
  .description("Official urBackend CLI — manage projects, schemas, and more")
  .version("0.2.0", "-v, -V, --version", "Output the current version");

// ── Authentication ──────────────────────────────────────────────────────────

program
  .command("login")
  .description("Authenticate with a Personal Access Token")
  .action(loginCommand);

program
  .command("logout")
  .description("Remove stored credentials from this machine")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show the currently authenticated developer")
  .action(whoamiCommand);

// ── Projects ─────────────────────────────────────────────────────────────────

const projectCmd = program
  .command("project")
  .description("Manage urBackend projects");

projectCmd
  .command("list")
  .alias("ls")
  .description("List all accessible projects")
  .action(projectListCommand);

projectCmd
  .command("use [projectIdOrName]")
  .description("Set the active project for subsequent commands")
  .action(projectUseCommand);

projectCmd
  .command("info [projectId]")
  .description("Show details for the active (or specified) project")
  .action(projectInfoCommand);

// ── Collections ──────────────────────────────────────────────────────────────

const collectionCmd = program
  .command("collection")
  .alias("col")
  .description("Manage collections inside the active project");

collectionCmd
  .command("list")
  .alias("ls")
  .description("List all collections in the active project")
  .option("-p, --project <projectId>", "Target a specific project ID")
  .action((options) => collectionListCommand(options.project));

collectionCmd
  .command("delete <collectionName>")
  .alias("rm")
  .description("Delete a collection and all its data")
  .option("-f, --force", "Skip confirmation prompt")
  .option("-p, --project <projectId>", "Target a specific project ID")
  .action((name, options) => collectionDeleteCommand(name, options));

// ── Status ────────────────────────────────────────────────────────────────────

program
  .command("status")
  .description("Show account usage and recent API activity")
  .action(statusCommand);

// ── Doctor ────────────────────────────────────────────────────────────────────

program
  .command("doctor")
  .description("Run diagnostic checks on your CLI setup")
  .option("--json", "Output results as JSON (useful for CI/AI agents)")
  .action((options) => doctorCommand(options));

// ── Workspace ─────────────────────────────────────────────────────────────────

program
  .command("init [projectIdOrName]")
  .description("Initialize a local urBackend project workspace")
  .action((projectIdOrName) => initCommand(typeof projectIdOrName === "string" ? projectIdOrName : undefined));

program
  .command("pull")
  .description("Fetch the latest schemas for the linked project")
  .action(pullCommand);

program
  .command("push")
  .description("Push local schemas to the remote project")
  .action(pushCommand);

program
  .command("generate")
  .description("Generate TypeScript definitions from local schemas")
  .action(generateCommand);

// ── Parse ─────────────────────────────────────────────────────────────────────

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
