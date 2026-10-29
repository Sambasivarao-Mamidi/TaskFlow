# TaskFlow

TaskFlow is a full-stack productivity platform for organizing projects, tracking tasks, and monitoring progress from one workspace.

## MVP Goal

Build one complete vertical slice:

- Register and log in
- Create a workspace
- Create a project inside it
- Create, update, complete, filter, and paginate tasks
- Show task counts on a dashboard
- Use user-scoped BYOK AI task breakdown

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- State: TanStack Query + Zustand
- Validation: Zod in shared/
- Deployment: same-origin

## Repository Layout

```text
taskflow/
  client/
  server/
  shared/
```

## Features

### Authentication

- Register, login, logout, and current-user retrieval
- JWT access token stored only in React memory
- HttpOnly, Secure, SameSite=Strict refresh-token cookie
- Refresh-token rotation with reuse detection
- Password hashing with bcrypt cost 12
- Minimum 8-character password policy

### Workspaces

- Create and list workspaces
- Workspace creator becomes member with role `owner`
- Only owner can delete workspace
- Workspace deletion hard-deletes projects and tasks atomically

### Projects

- CRUD inside a workspace
- Active and archived statuses
- Archiving supported through status updates
- Project deletion hard-deletes its tasks atomically

### Tasks

- CRUD inside a project
- Statuses: `todo`, `in-progress`, `done`
- Priorities: `low`, `medium`, `high`, `urgent`
- Optional description, due date, and assignee
- Assignee must be a workspace member
- Unrestricted status transitions
- Cursor-based pagination
- Sort: `createdAt` descending, `_id` tie-breaker
- Filters: status, priority, assigneeId, dueBefore
- Due dates stored as UTC and rendered locally

### Dashboard

- Total tasks
- Completed tasks
- In-progress tasks
- Overdue tasks

### BYOK AI Task Breakdown

- One encrypted OpenAI key per user
- User selects an allowed model
- Allowed models: `gpt-4o-mini`, `gpt-4o`, `gpt-4.1-mini`
- Key validated before save
- AI key decrypted only in server memory
- Only masked key is returned
- 10 AI requests per user per fixed 1-hour window
- Generated subtasks can be accepted as real tasks

## Data Models

### User

- name
- email (unique)
- passwordHash
- createdAt

### RefreshToken

- userId
- tokenHash (unique)
- familyId
- expiresAt
- usedAt
- revokedAt
- createdAt

### Workspace

- name
- ownerId
- members: `[{ userId, role }]`

### Project

- workspaceId
- name
- description
- status: `active` or `archived`
- createdBy
- createdAt

### Task

- workspaceId
- projectId
- title
- description
- status
- priority
- dueDate
- assigneeId
- createdBy
- createdAt

### AiKey

- userId
- provider: `openai`
- model
- encryptedKey
- keyHint
- isActive
- createdAt
- updatedAt

### AiRateLimit

- userId
- hourBucket
- count
- expiresAt

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Workspaces

- `GET /api/workspaces`
- `POST /api/workspaces`
- `DELETE /api/workspaces/:id`

### Projects

- `GET /api/workspaces/:id/projects`
- `POST /api/workspaces/:id/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

### Tasks

- `GET /api/projects/:id/tasks`
- `POST /api/projects/:id/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Dashboard

- `GET /api/dashboard/:workspaceId`

### AI

- `POST /api/ai/keys`
- `GET /api/ai/keys/status`
- `DELETE /api/ai/keys`
- `POST /api/ai/task-breakdown`

## Error Response Shape

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## Security Rules

- BYOK keys encrypted with AES-256-GCM before storage
- Encryption key stored in environment variable
- API key decrypted only in server memory
- Only masked key is returned after save
- AI endpoints use only the authenticated user's key
- AI requests limited to 10 per user per fixed 1-hour window
- AI key validated with a lightweight provider request before save
- If validation fails due to network/provider outage, saving as unverified is allowed
- User-selected model validated against shared allowlist
- Refresh tokens stored as SHA-256 hashes
- Refresh-token reuse detection revokes the full token family
- Workspace membership checked on every workspace-scoped route

## Build Order

1. Scaffold client, server, and shared
2. Add environment files
3. Create Express app, health route, and error handler
4. Connect MongoDB
5. Implement authentication
6. Implement workspaces
7. Implement projects
8. Implement tasks with cursor pagination
9. Implement dashboard
10. Build auth pages and protected routes
11. Build workspace, project, and task pages
12. Build dashboard counts
13. Implement BYOK AI key settings and task breakdown
14. Add TypeScript typecheck scripts
15. Add tests

## Testing

- Vitest for shared utilities and frontend components
- supertest for Express route integration tests
- Manual end-to-end checks for the full vertical slice

## Out of Scope for MVP

- Password reset/change
- Account deletion
- Email invitations
- Comments
- Charts beyond counts
- Teams/roles beyond owner
- Workspace-scoped AI keys
- Real-time collaboration
- File attachments
- Billing/subscriptions

## Validation Plan

- Health route returns `{ status: "ok" }`
- Register, login, refresh, and logout work
- Workspace persists after refresh
- Project persists after refresh
- Task CRUD, filters, pagination, and status updates persist
- Dashboard counts update after task changes
- AI key saves and only masked value is returned
- AI task breakdown works with user's own key and selected model
- TypeScript typecheck passes
- Vitest and supertest suites pass
