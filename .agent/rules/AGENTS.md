# AGENTS.md

This file provides guidelines for AI agents working in this repository.

## Build / Lint / Test Commands

```bash
# Development
pnpm dev                    # Start Vite dev server on port 3000
npx convex dev              # Start Convex dev server (port 3210)

# Building
pnpm build                  # Vite build for production
pnpm preview                # Preview production build

# Linting & Formatting (Biome)
pnpm format                 # Format code with Biome
pnpm lint                   # Lint with Biome
pnpm check                  # Run Biome check (format + lint)

# Testing
pnpm test                   # Run Vitest tests
vitest run <file>           # Run single test file
vitest run -t "<pattern>"   # Run tests matching pattern

# Deployment
pnpm deploy                 # Build + Wrangler deploy to Cloudflare
```

## Code Style Guidelines

### General Principles
- Follow Biome formatting (140 line width) - configured in `biome.json`
- Use TypeScript `type` definitions, not `interface` for object types
- Enable Biome organize imports on save
- Avoid magic numbers; extract to named constants

### Imports & Path Aliases
```ts
// Use path aliases configured in tsconfig.json
import { api } from "convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";

// Convex functions use @/convex/* alias
// Src files use @/* alias
```

### React & Components
- Use `@tanstack/react-query` for data fetching with `useConvexMutation`/`useConvexQuery`
- Follow TanStack Router patterns for routes (file-based routing)
- Use shadcn/ui components (install via `pnpm dlx shadcn@latest add <component>`)
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Use `cva` (class-variance-authority) for component variants

### Convex Backend (convex/ folder)
- Use Effect-TS with Confect for mutations/queries: `E.gen(function* () { ... })`
- Schema defined in `convex/schema.ts` using `defineSchema`/`defineTable`
- Table indexes defined on tables (e.g., `.index("by_api", ["apiId"])`)
- Use `api.shows.setPreference` pattern for scheduled functions
- When referencing functions in scheduler, use type assertions if needed: `// @ts-expect-error`

### State Management
- Use `preference` field: `"favorite" | "unset" | "ignored"` (not boolean `isFavorite`)
- Update existing queries to use preference indexes:
  - `by_preference_and_name` for favorites sorted by name
  - `by_preference_and_rating` for unset sorted by rating
  - `by_preference_and_weight` for unset sorted by weight

### Error Handling
- Convex: Return `null` for mutations, `E.Effect<null, Error, MutationCtx>` type
- React: Use `toast.error()` from `sonner` for user feedback
- Use `try/catch` in effects with proper error mapping

### Naming Conventions
- Files: kebab-case for components (`show-items.tsx`), camelCase for utilities
- Variables: camelCase, descriptive names
- Types: PascalCase, use `Shows["Entity"]` pattern for entity types
- Mutations: `setPreference`, `createManyMissing`, `fetchManyMissingPerPage`
- Queries: `readManyFavorites`, `readById`, `readManyTopRatedUnset`

### UI Patterns
- Two buttons in list items: heart (toggle favorite/unset), eye-off (toggle ignore)
- Detail page: single cycling button through all three states
- Icons: use Lucide icons via `icon-[lucide--name]` class pattern

### Special Notes (from .cursorrules)
- Convex validators use `v.id()`, `v.optional()`, `v.union()`, etc.
- System fields `_id` and `_creationTime` are auto-added
- Use Effect-TS `Option` (`O.getOrThrow`, `O.isSome`) for nullable values
