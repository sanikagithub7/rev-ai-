# 🔌 Rev AI — API & Workflow Specification

## Workflow Foundation Route Handlers

### Workflows Endpoint (`/api/workflows`)
- **GET `/api/workflows`**: Returns all workflows scoped to the authenticated user's active organization.
- **POST `/api/workflows`**: Creates a new workflow record + default trigger node for the authenticated user's organization. Input validated via Zod schema (`name`, `description`, `triggerType`).

### Single Workflow Endpoint (`/api/workflows/[id]`)
- **GET `/api/workflows/[id]`**: Retrieves workflow details, attached nodes, and edges after verifying organization membership.
- **PATCH `/api/workflows/[id]`**: Updates workflow properties (`name`, `description`, `status`, `nodes`, `edges`).
- **DELETE `/api/workflows/[id]`**: Deletes target workflow after verifying ownership.
