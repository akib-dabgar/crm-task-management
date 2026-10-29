# REST API Specification
## Actowiz Solutions — Role-Based Task Manager

---

## 1. Overview & Conventions

- **Base URL**: `/api`
- **Data Format**: `application/json` for requests and responses
- **Authentication**: JWT Bearer token passed in the `Authorization` header:
  `Authorization: Bearer <token>`
- **Response Format**:
  - Success responses return JSON objects containing data and relevant pagination metadata.
  - Standard error responses follow: `{ "error": "Descriptive error message" }`.
  - **Validation error responses (Joi)** return:
    ```json
    {
      "error": "Validation failed",
      "details": [
        "\"email\" must be a valid email",
        "\"password\" length must be at least 6 characters long"
      ]
    }
    ```

---

## 2. HTTP Status Code Conventions

| Status Code | Meaning | Usage in System |
| :--- | :--- | :--- |
| `200 OK` | Standard success | Resource retrieved or successfully updated |
| `201 Created` | Created | User, Team, Project, Task, Comment created |
| `400 Bad Request` | Validation failure | Joi schema validation failure, invalid status transition, missing return reason |
| `401 Unauthorized` | Authentication error | Missing token, invalid token, account deactivated |
| `403 Forbidden` | Authorization error | Insufficient role or accessing resource outside permitted team/assignment |
| `404 Not Found` | Resource not found | Task, Project, User, or Team ID does not exist |
| `500 Server Error` | Internal server error | Unhandled server or database exception |

---

## 3. Authentication Endpoints

### 3.1 Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "manager.alpha@actowiz.com",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "671e21b7f1e40b12a8f90001",
    "name": "Sarah Jenkins",
    "email": "manager.alpha@actowiz.com",
    "role": "Manager",
    "team": "671e21b7f1e40b12a8f90100",
    "isActive": true
  }
}
```
- **Error (401 Unauthorized)**:
```json
{ "error": "Invalid email or password" }
```
- **Error (403 Forbidden)**:
```json
{ "error": "Account has been deactivated. Please contact an Administrator." }
```

### 3.2 Get Current User
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: Authenticated (All Roles)
- **Response (200 OK)**:
```json
{
  "user": {
    "id": "671e21b7f1e40b12a8f90001",
    "name": "Sarah Jenkins",
    "email": "manager.alpha@actowiz.com",
    "role": "Manager",
    "team": {
      "id": "671e21b7f1e40b12a8f90100",
      "name": "Team Alpha"
    }
  }
}
```

---

## 4. User & Team Management Endpoints (Admin Only)

### 4.1 List Users
- **Method**: `GET`
- **Endpoint**: `/api/users`
- **Access**: Admin only
- **Query Parameters**: `role` (optional), `team` (optional), `search` (optional)
- **Response (200 OK)**:
```json
[
  {
    "_id": "671e21b7f1e40b12a8f90001",
    "name": "Sarah Jenkins",
    "email": "manager.alpha@actowiz.com",
    "role": "Manager",
    "team": "671e21b7f1e40b12a8f90100",
    "isActive": true,
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
]
```

### 4.2 Create User
- **Method**: `POST`
- **Endpoint**: `/api/users`
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Alex Rivera",
  "email": "alex.rivera@actowiz.com",
  "password": "SecurePassword123!",
  "role": "Employee",
  "team": "671e21b7f1e40b12a8f90100"
}
```
- **Response (201 Created)**: User object with omitted password.

### 4.3 Update User & Assign Role
- **Method**: `PUT`
- **Endpoint**: `/api/users/:id`
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Alex Rivera",
  "role": "Manager",
  "team": "671e21b7f1e40b12a8f90100"
}
```

### 4.4 Toggle User Active Status (Deactivate / Reactivate)
- **Method**: `PATCH`
- **Endpoint**: `/api/users/:id/status`
- **Access**: Admin only
- **Request Body**:
```json
{
  "isActive": false
}
```
- **Response (200 OK)**: `{ "message": "User deactivated successfully", "user": { ... } }`

### 4.5 List Teams
- **Method**: `GET`
- **Endpoint**: `/api/teams`
- **Access**: Admin, Manager (Manager views own team details)
- **Response (200 OK)**:
```json
[
  {
    "_id": "671e21b7f1e40b12a8f90100",
    "name": "Team Alpha",
    "description": "Core Backend & Infrastructure Pod",
    "manager": {
      "_id": "671e21b7f1e40b12a8f90001",
      "name": "Sarah Jenkins",
      "email": "manager.alpha@actowiz.com"
    },
  }
]
```
*(Note: Team members are queried dynamically via `GET /api/users?team=:teamId` or populated in details response using `User.team`)*

### 4.6 Create Team
- **Method**: `POST`
- **Endpoint**: `/api/teams`
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Team Alpha",
  "description": "Enterprise Solutions Pod",
  "manager": "671e21b7f1e40b12a8f90001"
}
```
*(Backend validates that `manager` is an active user with role `Manager`, updates `User.team = team._id` for the manager, and enforces unique 1:1 Manager constraint)*

### 4.7 Update Team
- **Method**: `PUT`
- **Endpoint**: `/api/teams/:id`
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Team Alpha Updated",
  "description": "Updated Pod Description",
  "manager": "671e21b7f1e40b12a8f90002"
}
```

---

## 5. Project Management Endpoints

### 5.1 List Projects
- **Method**: `GET`
- **Endpoint**: `/api/projects`
- **Access**: Admin (all projects), Manager & Employee (scoped to team projects)
- **Response (200 OK)**:
```json
[
  {
    "_id": "671e21b7f1e40b12a8f90200",
    "name": "FinTech Payment Gateway Migration",
    "description": "Migrate payment rails to modern cloud infrastructure",
    "clientName": "Apex Global Bank",
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-11-15T00:00:00.000Z",
    "status": "Active",
    "team": {
      "_id": "671e21b7f1e40b12a8f90100",
      "name": "Team Alpha"
    },
    "totalTasks": 12,
    "completedTasks": 6,
    "progressPercentage": 50.0
  }
]
```

### 5.2 Create Project
- **Method**: `POST`
- **Endpoint**: `/api/projects`
- **Access**: Admin (any team), Manager (own team only)
- **Request Body**:
```json
{
  "name": "CRM Mobile App Integration",
  "description": "Develop mobile interface extensions for sales agents",
  "clientName": "Retail Corp",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-12-15T00:00:00.000Z",
  "status": "Planning",
  "team": "671e21b7f1e40b12a8f90100"
}
```

### 5.3 Get Project by ID
- **Method**: `GET`
- **Endpoint**: `/api/projects/:id`
- **Access**: Admin, or Manager/Employee of that project's team

---

## 6. Task Management Endpoints (Core Module)

### 6.1 List & Filter Tasks (with Pagination)
- **Method**: `GET`
- **Endpoint**: `/api/tasks`
- **Access**:
  - Admin: All tasks
  - Manager: Own team's tasks
  - Employee: Only tasks assigned to current user
- **Query Parameters**:
  - `page`: default `1`
  - `limit`: default `10`
  - `status`: `To Do`, `In Progress`, `In Review`, `Done`
  - `priority`: `Low`, `Medium`, `High`, `Urgent`
  - `assignee`: User ObjectId
  - `project`: Project ObjectId
  - `dueDate`: Date filter
  - `search`: Keyword for title/description
- **Response (200 OK)**:
```json
{
  "tasks": [
    {
      "_id": "671e21b7f1e40b12a8f90301",
      "title": "Build Webhook Receiver for Stripe",
      "description": "Implement idempotent endpoint for charge.succeeded events",
      "project": {
        "_id": "671e21b7f1e40b12a8f90200",
        "name": "FinTech Payment Gateway Migration"
      },
      "team": "671e21b7f1e40b12a8f90100",
      "assignee": {
        "_id": "671e21b7f1e40b12a8f90003",
        "name": "David Miller",
        "email": "david.miller@actowiz.com"
      },
      "priority": "High",
      "dueDate": "2026-10-27T18:00:00.000Z",
      "status": "In Progress",
      "isOverdue": true,
      "createdBy": {
        "_id": "671e21b7f1e40b12a8f90001",
        "name": "Sarah Jenkins"
      },
      "createdAt": "2026-10-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "totalTasks": 45,
    "currentPage": 1,
    "totalPages": 5,
    "limit": 10
  }
}
```

### 6.2 Create Task
- **Method**: `POST`
- **Endpoint**: `/api/tasks`
- **Access**: Admin (any project/team), Manager (own team projects only)
- **Request Body**:
```json
{
  "title": "Optimize DB Indexes for Task Queries",
  "description": "Add compound index on team and status fields",
  "project": "671e21b7f1e40b12a8f90200",
  "assignee": "671e21b7f1e40b12a8f90003",
  "priority": "High",
  "dueDate": "2026-10-29T18:00:00.000Z"
}
```
- **Validation**:
  - **Team Consistency Enforcement**: The assignee MUST belong to the project's assigned team. This rule applies to **both Admin and Manager**. If the assignee does not belong to the project's team, returns `400 Bad Request: "Assignee does not belong to the project team"`.
  - For Managers, the project must belong to the Manager's assigned team. If not, returns `403 Forbidden: "Cannot create tasks for another team's project"`.

### 6.3 Update Task Details
- **Method**: `PUT`
- **Endpoint**: `/api/tasks/:id`
- **Access**: Admin, Manager (own team only). **Forbidden for Employee (403)**.
- **Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "priority": "Urgent",
  "assignee": "671e21b7f1e40b12a8f90004",
  "dueDate": "2026-10-31T18:00:00.000Z"
}
```
- **Validation**:
  - Any reassigned `assignee` must belong to the task's project team. If not, returns `400 Bad Request`.

### 6.4 Update Task Status (Strict Assignment Workflow Engine)
- **Method**: `PATCH`
- **Endpoint**: `/api/tasks/:id/status`
- **Access**:
  - Admin: Any valid transition globally per Access Control Matrix
  - Manager: Any valid transition for own team tasks (must provide non-empty `reason` when moving `In Review` → `In Progress`)
  - Employee: Own assigned tasks only (`To Do` → `In Progress` → `In Review`). **Cannot mark Done (403)**. **Cannot access tasks not assigned to them (403)**.
- **Workflow Transitions**:
  - Normal Flow: `To Do` → `In Progress` → `In Review` → `Done`
  - Review Action: `In Review` → `In Progress` with a required non-empty `reason` (Manager/Admin only)
- **Request Body (Standard Transition)**:
```json
{
  "status": "In Review"
}
```
- **Request Body (Manager Rejection with Reason)**:
```json
{
  "status": "In Progress",
  "reason": "Missing automated tests for edge cases."
}
```
- **Errors**:
  - `400 Bad Request`: `{ "error": "Rejection reason is mandatory when returning task to In Progress" }`
  - `400 Bad Request`: `{ "error": "Invalid status transition" }`
  - `403 Forbidden`: `{ "error": "Employees are not authorized to mark tasks Done" }`
  - `403 Forbidden`: `{ "error": "Cannot update tasks not assigned to you" }`

---

## 7. Comments & Activity Log Endpoints

### 7.1 Add Comment
- **Method**: `POST`
- **Endpoint**: `/api/tasks/:id/comments`
- **Access**: Admin, Manager (own team task), Employee (**own assigned task only**)
- **Error (403 Forbidden)**: Returned if an Employee attempts to comment on a task not assigned to them.
- **Request Body**:
```json
{
  "content": "I have deployed the fix to the staging environment for review."
}
```

### 7.2 Get Task Comments & Activity History
- **Method**: `GET`
- **Endpoint**: `/api/tasks/:id/history`
- **Access**: Admin, Manager (own team task), Employee (**own assigned task only**)
- **Error (403 Forbidden)**: Returned if an Employee attempts to view history of a task not assigned to them.
- **Response (200 OK)**:
```json
{
  "comments": [
    {
      "_id": "671e21b7f1e40b12a8f90501",
      "author": { "name": "David Miller", "role": "Employee" },
      "content": "Completed unit tests.",
      "createdAt": "2026-10-28T11:00:00.000Z"
    }
  ],
  "activityLogs": [
    {
      "_id": "671e21b7f1e40b12a8f90601",
      "actor": { "name": "David Miller", "role": "Employee" },
      "actionType": "STATUS_CHANGE",
      "details": { "from": "In Progress", "to": "In Review" },
      "createdAt": "2026-10-28T11:05:00.000Z"
    },
    {
      "_id": "671e21b7f1e40b12a8f90602",
      "actor": { "name": "Sarah Jenkins", "role": "Manager" },
      "actionType": "STATUS_CHANGE",
      "details": {
        "from": "In Review",
        "to": "In Progress",
        "reason": "Please check payload edge-cases."
      },
      "createdAt": "2026-10-28T11:30:00.000Z"
    }
  ]
}
```

---

## 8. Notifications Endpoints

### 8.1 Get Notifications
- **Method**: `GET`
- **Endpoint**: `/api/notifications`
- **Access**: Authenticated user (fetches notifications for current user)
- **Response (200 OK)**:
```json
{
  "unreadCount": 2,
  "notifications": [
    {
      "_id": "671e21b7f1e40b12a8f90701",
      "message": "Task 'Build Webhook Receiver' is due in less than 24 hours.",
      "type": "TASK_DUE_SOON",
      "task": "671e21b7f1e40b12a8f90301",
      "isRead": false,
      "createdAt": "2026-10-28T08:00:00.000Z"
    }
  ]
}
```

### 8.2 Mark Notification as Read
- **Method**: `PATCH`
- **Endpoint**: `/api/notifications/:id/read`
- **Access**: Owner of notification

### 8.3 Mark All Notifications as Read
- **Method**: `PATCH`
- **Endpoint**: `/api/notifications/read-all`
- **Access**: Authenticated user

---

## 9. Dashboard Endpoints

### 9.1 Get Role-Specific Dashboard Metrics
- **Method**: `GET`
- **Endpoint**: `/api/dashboard`
- **Access**: Authenticated (response payload dynamically shapes to caller's role)
- **Admin Response Example**:
```json
{
  "role": "Admin",
  "totalUsers": 6,
  "totalProjects": 4,
  "tasksByStatus": {
    "toDo": 8,
    "inProgress": 14,
    "inReview": 5,
    "done": 20
  },
  "overdueTasksCount": 3
}
```
- **Manager Response Example**:
```json
{
  "role": "Manager",
  "teamName": "Team Alpha",
  "teamWorkload": [
    { "userId": "671e21b7f1e40b12a8f90003", "name": "David Miller", "activeTasks": 4 },
    { "userId": "671e21b7f1e40b12a8f90004", "name": "Lisa Ray", "activeTasks": 3 }
  ],
  "tasksAwaitingReview": [
    { "_id": "671e21b7f1e40b12a8f90305", "title": "API Documentation", "assignee": "David Miller" }
  ],
  "overdueTasksCount": 1
}
```
- **Employee Response Example**:
```json
{
  "role": "Employee",
  "myTasksByStatus": {
    "toDo": 2,
    "inProgress": 3,
    "inReview": 1
  },
  "dueTodayCount": 1,
  "overdueCount": 1
}
```
