# Agent Instructions

**Before coding:** Read [docs/PROJECT_MASTER.md](./docs/PROJECT_MASTER.md) for product vision, architecture, sprint status, feature flags, and conventions.

**State management:** Use **Redux Toolkit** behind feature hooks (`useSidebar`, `useChat`, etc.). Components must never import `store/` or use `useSelector`/`useDispatch` directly.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
