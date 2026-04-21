# Contributing to urBackend

Thank you for your interest in contributing to urBackend! We welcome contributions to help make this "Backend-as-a-Service" platform even better.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

## 🚀 Getting Started

### 1. Fork and Clone
Fork the repository to your GitHub account and then clone it locally:

```bash
git clone https://github.com/YOUR_USERNAME/urBackend.git
cd urBackend
```

### 2. Project Structure
The repository is organized into a monorepo-style structure:

#### Applications (`apps/`)
-   **`apps/dashboard-api`**: The internal API handling dashboard operations, project management, and user authentication for the urBackend platform.
-   **`apps/public-api`**: The public-facing API that users' applications interact with to store data, manage users, and handle storage.
-   **`apps/web-dashboard`**: The React-based frontend dashboard where users manage their projects and keys.

#### Packages (`packages/`)
-   **`packages/common`**: Shared logic, MongoDB models, and utility functions used by both APIs.

#### Examples (`examples/`)
-   **`examples/social-demo`**: A full-featured X.com clone demonstrating the capabilities of urBackend.

### 3. Setup and Installation

#### Prerequisites
-   **Node.js**: v18 or later.
-   **MongoDB**: A running instance (local or Atlas).
-   **Redis**: Required for API key caching in `public-api`.

#### Installation
1.  From the root directory, install all dependencies for the entire monorepo:
    ```bash
    npm install
    ```
    This will automatically link all packages and install dependencies for all apps.

#### Running Locally

You can start all main applications at once (useful for testing end-to-end):
```bash
npm run dev
```

If you only want to work on a specific application:
-   **Dashboard API**: `npm run dev --workspace=dashboard-api`
-   **Public API**: `npm run dev --workspace=public-api`
-   **Web Dashboard**: `npm run dev --workspace=web-dashboard`

## 🛠️ Development Workflow

1.  **Create a Branch**: Always create a new branch for your work. Use descriptive names like `feature/new-login-ui` or `fix/database-connection`.
    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Make Changes**: Implement your feature or fix. Follow the existing coding style and ensure your code is well-documented.

3.  **Test Your Changes**:
    -   Ensure there are no linting errors across the project:
      ```bash
      npm run lint --workspaces --if-present
      ```

4.  **Commit**: Use clear and concise commit messages following conventional commits standard if possible.
    ```bash
    git commit -m "feat: add social auth support"
    ```

5.  **Push**: Push your branch to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```

## 📬 Submitting a Pull Request (PR)

1.  Go to the original repository and click "Compare & pull request".
2.  Provide a clear title and description of your changes.
3.  Link any related issues (e.g., "Fixes #123").
4.  Wait for review and address any feedback.

## 📄 Contributor License Policy

- No CLA or DCO sign-off is currently required for this repository.
- By submitting a contribution, you agree that your changes are licensed under the license declared by the package you modify:
  - Core monorepo apps/packages: `AGPL-3.0-only`
  - `examples/*` and `@urbackend/sdk` package: `MIT`

## 🐛 Reporting Bugs & Feature Requests

-   **Bugs**: If you find a bug, please create an issue describing the problem, steps to reproduce, and expected behavior.
-   **Features**: If you have an idea for a new feature, feel free to open an issue to discuss it before starting implementation.

## 🤝 Code of Conduct

Please be respectful and considerate of others. We aim to create a welcoming and inclusive environment for all contributors.

---
Happy Coding! 🚀
