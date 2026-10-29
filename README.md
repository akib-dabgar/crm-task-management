# Role-Based Task Manager System (Simple CRM Style)

A full-stack, CRM-style task management web application built for the featuring robust Role-Based Access Control (RBAC), team-scoped permissions, state-machine workflow enforcement, audit activity logs, in-app notifications, and role-tailored dashboards.

---

## 1. Project Overview & Role Matrix

This system streamlines collaborative project and task management across three distinct organizational tiers:

- **Admin**:
  - Full company-wide operational visibility.
  - Creates and manages users, toggles active/inactive account status.
  - Configures team pods, assigns team managers, and synchronizes employee rosters.
  - Creates projects globally across all teams and oversees all tasks.
  - Global dashboard with aggregated metrics, team performance bars, and live audit feed.
- **Manager**:
  - Leads their specific team pod (enforces strict team scoping).
  - Creates and manages team projects with real-time dynamic progress calculation.
  - Creates and assigns tasks strictly to members of their own team.
  - Reviews deliverables submitted to `In Review`. Only Managers (or Admins) can approve and mark tasks `Done` or return tasks back to `In Progress` with a mandatory `reviewReason`.
  - Team dashboard with review queue and employee workload distribution.
- **Employee**:
  - Workspace scoped strictly to their assigned tasks.
  - Advances task status from `To Do` → `In Progress` → `In Review`.
  - Adds comments on assigned tasks and reviews manager feedback.
  - Receives in-app notifications for task assignments, status changes, and 24h deadline alerts.
  - Personalized dashboard with due today alerts and overdue task warnings.

---

## 2. Technology Stack & Architecture

- **Frontend**: React.js (Vite), React Router v7, Tailwind CSS v4, Lucide React icons, Axios
- **Backend**: Node.js, Express.js (ES Modules), Joi (`joi`), JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, CORS, Morgan
- **Database**: MongoDB with Mongoose ODM
- **Architecture Pattern**: Clean Layered & Repository Architecture:
  `Routes` → `Controllers` → `Services (Business Rules & RBAC)` → `Repositories (Database Access)` → `Mongoose Models`
- **Single Source of Truth for Team Membership**: `User.team` is the sole source of truth. Teams do not maintain redundant member arrays, completely eliminating synchronization drift.
- **Strict Code Standard**: **Zero comments in code** (`.js`, `.jsx`, `.css`). Clean, self-documenting code.

---

## 3. Seed Credentials (Ready to Test)

The database includes pre-configured demo accounts. Run `npm run seed` in the `server/` directory to reset and seed the database anytime.

| Role | Name | Email | Password | Team Assignment |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Actowiz Admin | `admin@actowiz.com` | `Admin@123` | Global (All Teams) |
| **Manager** | Sarah Jenkins | `manager.alpha@actowiz.com` | `Manager@123` | Team Alpha (Lead) |
| **Manager** | David Chen | `manager.beta@actowiz.com` | `Manager@123` | Team Beta (Lead) |
| **Employee** | Alex Rivera | `emp.alpha1@actowiz.com` | `Employee@123` | Team Alpha |
| **Employee** | Maya Patel | `emp.alpha2@actowiz.com` | `Employee@123` | Team Alpha |
| **Employee** | Liam Torres | `emp.beta1@actowiz.com` | `Employee@123` | Team Beta |

> **Quick Demo**: The login page (`/login`) includes one-click "Demo Quick Sign-in" buttons for Admin, Manager, and Employee.

---

## 4. Installation & Quick Start

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+ or v10+)
- Local MongoDB running at `mongodb://localhost:27017` (or MongoDB Atlas)

### Step 1: Backend Setup
```bash
cd server
npm install

# Verify .env configuration (defaults to PORT=5000, MONGODB_URI=mongodb://localhost:27017/actowiz_task_manager)
# Seed the database with users, teams, projects, tasks, comments, and notifications:
npm run seed

# Run the backend server:
npm run dev
# Server running at http://localhost:5000
```

### Step 2: Frontend Setup
```bash
cd client
npm install

# Start the frontend Vite development server:
npm start
# Client running at http://localhost:5173
```

### Alternative: Run with Docker Compose (Local)
```bash
# Build and start MongoDB, Server, and Client containers:
docker compose up --build
```

---

## 5. Automated Verification & Testing

The backend test suite uses Node's native test runner (`node:test`) and covers all 7 functional modules:

```bash
cd server
npm test
```

### Test Suite Results (100% Passing):
- `tests/foundation.test.js`: 4/4 passing (Health check, constants freezing, Joi middleware, 404 handler)
- `tests/auth.test.js`: 8/8 passing (Password bcrypt hashing, login success, invalid password, deactivated user 403, JWT verification, logout)
- `tests/users_teams.test.js`: 8/8 passing (Admin-only RBAC, user creation, user filtering, team manager assignment, duplicate manager prevention, employee roster sync)
- `tests/projects.test.js`: 8/8 passing (Role-scoped creation, team isolation, date validation, progress percentage calculation)
- `tests/tasks.test.js`: 8/8 passing (Assignee team isolation, status workflow gates, overdue calculation, mandatory reviewReason on rejection)
- `tests/comments_notifications.test.js`: 7/7 passing (Comment authorization matrix, audit log recording, notification dispatch, 24h due reminder scanner)
- `tests/dashboard.test.js`: 5/5 passing (Admin global metrics, Manager team review queue & workload, Employee personalized tasks)
- **Total**: **48 / 48 tests passing (0 failures)**

### Frontend Production Build:
```bash
cd client
npm run build
# vite build completed with 0 errors, 0 warnings
```

---

## 6. Key Features & Business Logic Implementation

### 1. Task Workflow State Machine
```
[To Do] ──> [In Progress] ──> [In Review] ──> [Done]
                  ▲                 │
                  └─ (reviewReason) ┘
```
- **Employee**: Can move assigned tasks from `To Do` → `In Progress` → `In Review`. Cannot mark `Done`.
- **Manager / Admin**: Can mark `In Review` tasks as `Done`, or reject them back to `In Progress` with a **mandatory `reviewReason`**.
- Reopening from `Done` is strictly prohibited.

### 2. Comments Permission Matrix
- **Admin**: Can view and post comments on any task.
- **Manager**: Can view and post comments on tasks belonging to their team pod.
- **Employee**: Can view and post comments **only on tasks assigned to them**.

### 3. Dynamic Project Progress Calculation
Project progress percentage is calculated dynamically in `projectService.js`:
$$\text{Progress} = \left(\frac{\text{Completed Tasks}}{\text{Total Tasks}}\right) \times 100$$
Updates in real-time as tasks transition status.

### 4. Overdue Detection & 24h Deadline Alerts
- Overdue tasks (due date in past and status not `Done`) are highlighted with bold red pulsing badges in Kanban and list views.
- Tasks due within 24 hours trigger automated in-app notifications with deduplication via `dueSoonAlertSent: true`.

---

## 7. Key Assumptions & Architectural Decisions

To ensure system integrity, security, and clean separation of concerns, the following architectural assumptions were made:

1. **Single Source of Truth for Team Membership (`User.team`)**:
   - Teams do not store a redundant array of member IDs. Instead, the `User.team` reference is the sole source of truth. This prevents synchronization drift when users are reassigned or deactivated.
2. **Team-Manager 1:1 Pod Model**:
   - Each team pod is led by exactly one Manager, and a Manager can manage at most one team at a time (enforced by database unique constraint and service validation).
3. **Strict Cross-Team Isolation**:
   - Tasks belong to a Project, which in turn belongs to a specific Team.
   - Tasks can only be assigned to active Employees belonging to that project's team. Managers cannot assign or view tasks across other pods.
4. **State Machine Finality**:
   - The workflow strictly follows `To Do` → `In Progress` → `In Review` → `Done`.
   - Only the Team Manager or Admin can mark a task `Done` or return it to `In Progress` (which mandates a non-empty `reviewReason`). Tasks marked `Done` cannot be reopened.
5. **Soft Deactivation over Hard Deletion**:
   - Admin user deactivation toggles `isActive: false` rather than deleting records from the database. This preserves historical task assignments, comment threads, and audit activity trails.
6. **24-Hour Due Date Alert Deduplication**:
   - The notification scanner alerts assignees for tasks due within 24 hours. The `dueSoonAlertSent` boolean flag guarantees that only one deadline notification is generated per task.

---

## 8. API & Testing Documentation

- [postman_collection.json](file:///d:/Actowiz/postman_collection.json) — Ready-to-import Postman collection covering all endpoints with auto-JWT saving.
- [docs/API.md](file:///d:/Actowiz/docs/API.md) — Comprehensive REST API specification and request/response contracts.

---

## 9. Development Steps

1. docs: add architecture, PRD, security notes, API spec and DB design

2. feat: set up express boilerplate, Joi validation middleware and shared constants

3. feat(auth): implement JWT authentication, bcrypt hashing, RBAC middlewares and login UI

4. feat(admin): add user and team management with repository layer and admin UI

5. feat(projects): add project management with dynamic progress tracking

6. feat(tasks): add task core module, state machine, overdue detection and filters

7. feat(activity): add comments, activity audit trail and in-app notifications

8. feat(dashboard): add role-specific dashboards and workload analytics

9. chore: add database seeding, end-to-end verification and submission package
