# KaryaIQ Frontend — AI-Powered Collaborative Work Management

A modern, responsive KaryaIQ frontend built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Lucide Icons**, and **TanStack Query**, engineered to integrate seamlessly with the FastAPI and PostgreSQL backend.

---

## 🎨 Visual Identity & Design System

KaryaIQ uses a clear, enterprise-ready visual system:
- **Palette**: Deep navy (`#14213D`), modern blue (`#1D4ED8`), white surfaces, light slate backgrounds, and accessible status colors.
- **Typography**: Clean, high-legibility sans-serif typography with responsive sizing and spacing.
- **Components**: Consistent buttons, cards, status badges, priority indicators, and fluid responsive layouts.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js** v18+ (tested on v22.14.0)
- **npm** v9+ (tested on 10.9.2)
- Running FastAPI backend (default port `8000`)

### 2. Setup
Navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default contents:
```env
# Optional: Set backend origin directly.
# When left empty, Vite dev server automatically proxies API requests (/auth, /tasks, /projects, /teams, /notifications, /comments, /ai, /ws) to http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🗺️ API-to-Screen Mapping

| Screen / Feature | Route | Backend API Endpoints | Methods | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Public landing page** | `/` | — | — | Introduces KaryaIQ, product capabilities, team roles, and registration/login entry points. |
| **Login** | `/login` | `/auth/login`<br>`/users/me` | `POST`<br>`GET` | Authenticates email & password, receives JWT token pair, fetches user profile. |
| **Registration** | `/register` | `/auth/register`<br>`/auth/login` | `POST`<br>`POST` | Registers new user (`username`, `email`, `password`, requested role), then auto-authenticates. |
| **Session Management** | *Global* | `/auth/refresh`<br>`/auth/logout` | `POST`<br>`POST` | Intercepts 401s, handles queued refresh-token exchange, handles idempotent logout. |
| **Task Board & List** | `/tasks` | `/tasks`<br>`/projects` | `GET`<br>`GET` | Fetches tasks with query filters (`status`, `priority`, `project_id`, `assignee_id`, `search`, `sort_by`, `sort_order`). |
| **Task Creation** | *Modal* | `/tasks` | `POST` | Creates new task with title, description, status, priority, deadline, project, assignee. |
| **AI Task Generation** | *Modal* | `/ai/tasks/from-text` | `POST` | Parses natural language instructions into structured task attributes. |
| **Task Details** | *Modal* | `/tasks/{id}` | `GET`, `PUT`, `DELETE` | Views task details, inline title/description editing, status/priority changes, deletion. |
| **Task Comments** | *Tab* | `/tasks/{id}/comments`<br>`/comments/{id}` | `GET`, `POST`<br>`PATCH`, `DELETE` | Real-time discussion thread, composer, inline comment editing, deletion. |
| **Task Activity** | *Tab* | `/tasks/{id}/activity` | `GET` | Chronological audit trail showing actions, actors, and metadata diffs. |
| **Task Attachments** | *Tab* | `/tasks/{id}/attachments`<br>`/tasks/{id}/attachments/{att_id}` | `GET`, `POST`<br>`GET`, `DELETE` | Multipart file upload with progress, streaming file download, and deletion. |
| **AI Task Summary** | *Tab* | `/ai/tasks/{id}/summary` | `POST` | Generates executive summary of task and discussion context. |
| **AI Priority Advisor** | *Tab* | `/ai/tasks/{id}/priority-suggestion` | `POST` | Evaluates task urgency and explains recommended priority with 1-click apply. |
| **Projects List** | `/projects` | `/projects`<br>`/teams` | `GET`<br>`GET` | Lists projects with associated team name and member count. |
| **Project Details** | `/projects/:id` | `/projects/{id}`<br>`/tasks?project_id={id}`<br>`/projects/{id}/members` | `GET`, `PATCH`, `DELETE`<br>`GET`<br>`GET`, `POST`, `DELETE` | Project dashboard with embedded Kanban board and member management. |
| **Teams List** | `/teams` | `/teams` | `GET`, `POST` | Workspace team management and organization overview. |
| **Team Details** | `/teams/:id` | `/teams/{id}`<br>`/teams/{id}/members` | `GET`, `PATCH`, `DELETE`<br>`GET`, `POST`, `DELETE` | Manages team membership, roles (`manager` \| `member`), and team-owned projects. |
| **Notifications** | `/notifications` | `/notifications`<br>`/notifications/{id}/read`<br>`/notifications/read-all`<br>`/notifications/{id}` | `GET`<br>`PATCH`<br>`POST`<br>`DELETE` | Notification center with unread filter, mark as read, mark all read, and delete. |
| **Profile & Settings** | `/settings` | `/users/me`<br>`/users`<br>`/users/{id}/role` | `GET`<br>`GET`<br>`PATCH` | Profile details, role permission overview, and Admin user-role management. |
| **Real-time Live Sync** | *Global* | `/ws?token={token}` | `WebSocket` | WebSocket connection for push events (`task.*`, `comment.*`, `notification.*`, `activity`). |

---

## 🛠️ Architecture & Features

### 1. Robust Authentication & Token Rotation
- **Thread-Safe Token Refresh Queue**: If multiple simultaneous API requests receive a 401 response, a queue mutex ensures only one refresh request is made. Pending requests await the rotated access token and replay automatically.
- **Clean Decoupling**: Tokens are parsed and validated without external heavy dependencies.
- **Session Expiry Broadcast**: Dispatches an application-wide event if refresh token expires, securely cleaning local storage and gracefully directing users to the login screen.

### 2. Real-Time WebSocket Synchronization
- Subscribes to the authenticated backend WebSocket `/ws?token=...`.
- Implements exponential backoff auto-reconnection (1s, 2s, 4s... up to 15s).
- Heartbeat keepalive (`ping` / `pong`) every 25 seconds.
- Automatically triggers TanStack Query cache invalidation for updated tasks, comments, and notifications upon arrival of server events.

### 3. Graceful Error Handling & Fallbacks
- **AI Service Configuration (503)**: If the backend has `AI_ENABLED=false`, the AI prompt and summary features display an informative status banner and offer a one-click transition to standard task workflows rather than failing silently.
- **RBAC Enforcement (403)**: Features like user directory and role modification are restricted according to user permissions (`admin`, `manager`, `member`).

---

## 🧪 Testing and Verification

- TypeScript compilation: `npm run build` passes with zero errors.
- Backend test suite: 74 passing tests in `pytest`.
