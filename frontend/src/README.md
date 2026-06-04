# Frontend source layout

Each feature is a **top-level folder** under `src/`. `app/` only wires routes to module **screens**.

## Atomic design (every module)

| Layer | Role | Examples |
|-------|------|----------|
| **atoms** | Smallest UI pieces | `Button`, `Badge`, shadcn `ui/button` |
| **molecules** | Several atoms composed | `ChatBubble`, `TicketRow`, `ErrorState` |
| **organisms** | Sections built from atoms/molecules | `ChatWindow`, `AuthShell`, `AppShell` |
| **screens** | Full page: organisms + **common** UI/hooks | `ChatScreen`, `LoginScreen` |
| **hooks** | All module hooks (Redux/API adapters) | `useChat`, `useTickets` |
| **state** | Redux slices + selectors for this module | `chatSlice` |
| **services** | Module-owned integrations (optional) | `auth/services/` |

**Screens** may import from their module and from `@/common/*` (atoms, molecules, organisms, hooks). They must not import `@/common/store` directly — use hooks.

## `common` module

Holds anything **reused across 2+ features**:

- `atoms/` — shared primitives + `atoms/ui/` (shadcn)
- `molecules/` — `ErrorState`, `EmptyState`, `LoadingBlock`, …
- `organisms/` — layout shell, `DashboardTemplate`, `RoleGuard`, providers
- `hooks/` — theme, user, org, sidebar, feature flags
- `state/slices/` — ui, user, org
- `store/` — root Redux store composition
- `services/` — Supabase + API client
- `lib/` — `utils`, `theme`, `navigation`, `palette` (no Redux)
- `config/` — `features.config.ts`

## Other top-level folders

```
src/
  app/           # Next.js routes only
  auth/ chat/ dashboard/ knowledge/ tickets/ welcome/
  common/        # shared module (above)
```

There is no separate `src/lib` or `src/config` — both live under `common/`.

## Cross-module rules

- Prefer **one module owning** a hook/service; other modules may import it (e.g. dashboard → `@/tickets/hooks/useTickets`).
- If logic is truly generic (auth headers, feature flags), it belongs in **common** or the owning domain’s `services/`.

## Naming

PascalCase component files; camelCase `use*` hooks and `*Slice` files; kebab-case folders. See `common/README.md`.
