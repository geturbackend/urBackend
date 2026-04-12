# Dashboard & UI/UX Transformation Plan

Convert the current dashboard into a premium "Command Center" with advanced diagnostics, usage tracking, and modern aesthetics.

## Proposed Changes

### 1. Backend: Analytics & Usage Endpoints
We need more data to power the new dashboard features.

#### [MODIFY] [project.controller.js](file:///e:/Majors/WEB/urBackend/apps/dashboard-api/src/controllers/project.controller.js)
- Update `getAllProject` to include `databaseUsed`, `databaseLimit`, `storageUsed`, and `storageLimit` in the response.
- Add a simulated/calculated `health` status for each project based on recent log success rates.

#### [NEW] [analytics.controller.js](file:///e:/Majors/WEB/urBackend/apps/dashboard-api/src/controllers/analytics.controller.js)
- Create `getGlobalStats`: Aggregates usage across all user projects.
- Create `getRecentActivity`: Fetches the last 15-20 entries from the `Log` collection for the authenticated user's projects.

---

### 2. Frontend: Premium Dashboard Overhaul (`/dashboard`)
Refactor the main dashboard for a more professional "at-a-glance" value.

#### [MODIFY] [index.css](file:///e:/Majors/WEB/urBackend/apps/web-dashboard/src/index.css)
- Define a "Premium Design System" with variables for:
  - Glassmorphism backgrounds (semi-transparent with blur).
  - Modern gradients (Primary-to-Purple or Sleek Dark).
  - Enhanced box-shadows.

#### [MODIFY] [Dashboard.jsx](file:///e:/Majors/WEB/urBackend/apps/web-dashboard/src/pages/Dashboard.jsx)
- **Top Section**: Add a "Global Usage Overview" belt with 3-4 key metrics.
- **Main Layout**: Split the layout (Grid for projects, Sidebar for Recent Activity).
- **Project Cards**: 
  - Add usage progress bars (Database & Storage).
  - Add status badges (Active/Warning).
  - Add a subtle background gradient or glass effect.

---

### 3. Frontend: Project Analytics & DX Overhaul (`/project/:id`)
Enhance the project-specific view to provide deeper insights.

#### [MODIFY] [ProjectDetails.jsx](file:///e:/Majors/WEB/urBackend/apps/web-dashboard/src/pages/ProjectDetails.jsx)
- **Analytics Tab**: Introduce a new section using `recharts` to show traffic/storage growth.
- **Quick-Start Section**: Add tabs (React, Node, cURL) with code snippets that auto-fill the project's API key.
- **Logs Panel**: A simple list component to show recent API calls specific to this project.

---

## Verification Plan

### Manual Verification
- **Aesthetics**: Visually inspect the dashboard on different screen sizes (Responsive check).
- **Data Accuracy**: Verify that the usage bars on project cards match the actual values in the database.
- **Logs**: Trigger some API calls through `cURL` and see if they appear in the "Recent Activity" feed.
- **Links**: Ensure all navigation (Collections -> Data, Settings) remains functional after the UI refactor.

## Open Questions
- **Activity Feed Format**: Should "Recent Activity" show raw API paths (e.g., `/api/data/posts`) or should we try to map them to friendly labels (e.g., "Post Created")?
- **Charts Granularity**: For the Project Detail page, should the charts show activity for the last 24 hours, last 7 days, or both?
- **Health logic**: Should we mark a project as "Warning" if it hits >80% usage, or reserve that for connection errors only?
