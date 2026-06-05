# HTTP API client (`src/common/api`)

| File | Role |
|------|------|
| `client.ts` | Typed REST calls (`listDocuments`, `queryKnowledge`, …) |
| `errors.ts` | `ApiClientError`, parse `ApiErrorResponse` from backend |
| `fetch.ts` | Timeouts and network error helpers |

Import types from `@/common/types`; import functions from `@/common/api` or `@/common/api/client`.

Legacy path `@/common/services/api` re-exports from here for one release cycle.
