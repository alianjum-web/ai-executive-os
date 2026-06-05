# Frontend types (`src/common/types`)

Mirrors `backend/app/models/http/` and `internal/` contracts.

```
types/
  http/
    enums.ts        ← backend http/enums.py
    schemas.ts      ← backend http/schemas.py
    errors.ts       ← backend http/errors.py
    stream-events.ts ← backend http/stream.py
  index.ts          ← re-exports (import from `@/common/types`)
```

HTTP client functions live in **`src/common/api/`** (not `services/api/`).

**Workflow:** change backend `app/models/http/*` → update matching file here → `npm run typecheck`.
