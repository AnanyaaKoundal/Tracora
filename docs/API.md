# API reference

Conventions that hold everywhere, then the routes by group.

| Convention | Meaning |
|---|---|
| Auth | `authenticate` verifies the JWT (cookie or `Authorization: Bearer`) and puts `company_id` on the request. Routers without it reject with `401` |
| Tenancy | Handlers scope by `company_id` **inside** the query. Another tenant's record is `404`, never `403` - a `403` would prove it exists |
| Roles | `authorizeRole([...])` gates a group; `is_admin` is server-assigned and cannot be set from a body |
| Server-owned fields | `company_id`, `*_id`, `is_admin`, `is_default` are stripped from update payloads |
| Errors | `{ success: false, message }` via the shared error handler; `404` = not found *or* not yours |

---

## Auth - `/auth`

| Method | Path | Auth |
|---|---|---|
| POST | `/auth/registerCompany` | - |
| POST | `/auth/company/verify` | - |
| POST | `/auth/login` | - |
| POST | `/auth/verifyOtp` | - |
| GET | `/auth/getCompanies` | - |
| POST | `/auth/logout` | ✓ |
| GET | `/auth/me` | ✓ |

## Bugs - `/bug`

All routes: `authenticate` + `authorizeRole([developer, manager, tester, admin])`.

| Method | Path | Notes |
|---|---|---|
| POST | `/bug/create-bug` | `project_id` re-validated against the tenant |
| GET | `/bug/getAllbugs` | optional `?project_id=` narrowing |
| GET | `/bug/:bug_id` | |
| PUT | `/bug/:bug_id` | emits `bug-status-changed-topic` / `bug-assigned-topic` on change |
| DELETE | `/bug/delete/:bug_id` | |

## Projects - `/projects`

| Method | Path | Auth |
|---|---|---|
| GET | `/projects/get-projects` | ✓ + role |
| GET | `/projects/company-projects` | ✓ |
| GET | `/projects/get-project/:project_id` | ✓ |

## Employees - `/employee`

All routes: `authenticate`.

| Method | Path |
|---|---|
| GET | `/employee/` |
| GET | `/employee/user/:emp_id` |
| PUT | `/employee/user/:emp_id` |
| GET | `/employee/dashboard` |
| GET | `/employee/getAssignees` |

## Roles - `/roles`

All routes: `authenticate`.

| Method | Path |
|---|---|
| GET | `/roles/` |
| GET | `/roles/role/:role_id` |

## Admin - `/admin`

All routes: `authenticate` + `authorizeRole([admin])`.

| Method | Path |
|---|---|
| GET | `/admin/getCompany` |
| PUT | `/admin/company/editPhone` · `/admin/company/editEmail` · `/admin/company/updatePassword` |
| GET · POST | `/admin/getRoles` · `/admin/createRole` |
| GET · PUT · DELETE | `/admin/role/:role_id` |
| DELETE | `/admin/deleteRoles` |
| GET · POST | `/admin/getAllEmployees` · `/admin/createEmployee` |
| GET · PUT · DELETE | `/admin/employee/:emp_id` |
| GET · POST | `/admin/get-projects` · `/admin/createProject` |
| GET · PUT · DELETE | `/admin/project/:p_id` |
| GET | `/admin/stats` · `/admin/stats/employees` · `/admin/stats/projects` · `/admin/stats/buglist` · `/admin/stats/bugtrends` |

## Comments - `/comment`

All routes: `authenticate`.

| Method | Path | Notes |
|---|---|---|
| POST | `/comment/postComment` | parent bug resolved inside the tenant first |
| POST | `/comment/fetchComments` | body `{ bugId }` |

## Notifications - `/notification`

All routes: `authenticate`.

| Method | Path |
|---|---|
| GET | `/notification/getNotifications` |
| POST | `/notification/markAsRead` |

## Assistant - `/ai`

All routes: `authenticate` + `authorizeRole([developer, manager, tester, admin])`.

| Method | Path |
|---|---|
| POST | `/ai/chat` |
| POST | `/ai/duplicates` · `/ai/suggest-title` |
| GET | `/ai/conversations` |
| GET · DELETE | `/ai/conversations/:conversation_id` |

## Internal assistant data - `/agent`

**Not for the browser.** `requireInternalKey` + `authenticate`; Express owns the Mongo
reads so the assistant service never opens a database connection for a live request.

| Method | Path |
|---|---|
| GET | `/agent/bugs/:bug_id` |
| GET | `/agent/projects` |
