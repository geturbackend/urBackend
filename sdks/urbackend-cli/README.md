# @urbackend/cli

The official CLI for urBackend. Sync your schemas, generate TypeScript types, and manage your projects from the terminal.

## Quick Start (Onboarding)

Get started with the CLI in just three steps:

### 1. Install & Login
Install the CLI globally (exposed as `ub`) and authenticate with your Personal Access Token (PAT).
```bash
npm install -g @urbackend/cli
ub login
```

### 2. Initialize Workspace
Link your local directory to a remote urBackend project.
```bash
ub init
```

### 3. Pull Schemas & Generate Types
Fetch your remote collection schemas and automatically generate strict TypeScript definitions (`urbackend.d.ts`).
```bash
ub pull
ub generate
```

## Documentation

For a comprehensive list of every command (`project`, `collection`, `doctor`, etc.) and detailed explanations of how the CLI works under the hood, please read the full documentation:

👉 **[urBackend CLI Reference Documentation](https://docs.ub.bitbros.in/cli/overview)**

## License

MIT
