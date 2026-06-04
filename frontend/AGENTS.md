# Agent Instructions

**Before coding:** Read [docs/PROJECT_MASTER.md](./docs/PROJECT_MASTER.md) for product vision, architecture, sprint status, feature flags, and conventions.

**State management:** Use **Redux Toolkit** behind feature hooks (`useSidebar`, `useChat`, etc.). Components must never import `store/` or use `useSelector`/`useDispatch` directly.

**Module layout:** Each feature under `src/<name>/` uses atomic folders: `atoms/`, `molecules/`, `organisms/`, `screens/`, `hooks/`, `state/` (+ `services/` when needed). Screens compose module + `common` UI/hooks only. Shared cross-feature code lives in `src/common/` (including `lib/`, `config/`, `store/`). See `src/README.md`.

**Naming:** PascalCase for React component files (including screens); camelCase for hooks (`use*`) and Redux slices (`*Slice`); kebab-case for module/route folders and shadcn `ui/` files; `*.service.ts` / `*.config.ts` for typed non-UI modules.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
