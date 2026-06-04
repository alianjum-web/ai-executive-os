# Common module

Shared UI (atoms → organisms), global hooks/state, store root, Supabase/API services, app config, and pure helpers.

## Folders

| Folder | Contents |
|--------|----------|
| `atoms/` | `Button`, `Input`, `Badge`, `Logo`, `ThemeToggle`; `atoms/ui/` = shadcn primitives |
| `molecules/` | Composed UI used on many pages (`ErrorState`, `EmptyState`, …) |
| `organisms/` | App shell, sidebar, `DashboardTemplate`, `RoleGuard`, `providers/` |
| `hooks/` | `useTheme`, `useUser`, `useOrg`, `useSidebar`, `useFeatureFlag`, … |
| `state/slices/` | `uiSlice`, `userSlice`, `orgSlice` |
| `store/` | `index.ts` (compose reducers), `hooks.ts` (typed Redux — internal to hooks only) |
| `services/` | `supabase/`, `api/` |
| `lib/` | `utils`, `theme`, `navigation`, `palette` |
| `config/` | `features.config.ts` |

## Imports

```ts
import { cn } from "@/common/lib/utils";
import { FEATURE_FLAGS } from "@/common/config";
import { Button } from "@/common/atoms/ui/button";
import { ErrorState } from "@/common/molecules/ErrorState";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";
```

Auth-specific code stays in `auth/services/`, not here.
