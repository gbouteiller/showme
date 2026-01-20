# AGENTS.md

This file provides essential information for agentic coding assistants working in this repository.
When you need to search docs, use `context7` tools.
If it is TanStack related, use `tanstack` tools.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm deploy           # Build and deploy to Cloudflare Workers

# Testing
pnpm test             # Run all tests
pnpm test --run <pattern>  # Run tests matching pattern

# Linting & Formatting
pnpm format           # Format code with Biome
pnpm lint             # Lint code with Biome
pnpm check            # Full Biome check (lint + format)
pnpm dlx ultracite fix    # Auto-fix all Ultracite issues
pnpm dlx ultracite check  # Check for Ultracite issues

# Adding Components
pnpm dlx shadcn@latest add <component>  # Add shadcn/ui component
```

## Code Style Guidelines

### Import Organization
- Place type imports first: `import type { ... } from "..."` or `import { type ... } from "..."`
- Group imports: external libraries, internal components, relative files
- Use specific imports over namespace imports
- Use `@/*` for src files, `@/convex/*` for Convex files

### Formatting
- Line width: 140 characters
- Use `type` keyword for type definitions (Biome enforced)
- Use Biome/Ultracite for automatic formatting - most issues are auto-fixable
- Comment section separators like `// ROUTE -------------------------------------------------------------------`

### Naming Conventions
- **Variables/Functions**: camelCase (`const userData`)
- **Components**: PascalCase (`function UserProfile()`)
- **Constants/Config**: UPPER_CASE (`const API_URL`)
- **Files**: kebab-case (`user-profile.tsx`)
- **Schemas**: Prefixed with 's' (`sShow`, `sShowFields`)
- **Types**: PascalCase, exported at end of file

### TypeScript & Types
- Strict mode enabled - explicit typing everywhere
- Use `unknown` over `any` when type is unknown
- Prefer `type` over `interface` for type definitions
- Use const assertions (`as const`) for literal types
- Extract types from Schemas using `.Type` or `.Encoded` (Effect)

### Component Patterns
- Use function components only (no class components)
- Define components outside parent components
- Destructure props in function signature
- Use `className={cn(...)}` for class merging (clsx + tailwind-merge)
- Use `cva()` for component variants with `VariantProps<>` type
- Place `type ComponentProps` after component definition

### React Patterns
- Call hooks at top level only
- Use semantic HTML (`<button>`, `<nav>`, etc.) over divs with roles
- Include `key` prop for iterated elements (prefer unique IDs over indices)
- Use Link from `@tanstack/react-router` for navigation
- In React 19+, use ref as prop instead of `React.forwardRef`

### Routing (TanStack Router)
- File-based routing in `src/routes/`
- Dynamic routes: `series.$showId.tsx`
- Use `createFileRoute()` to define routes
- Export `Route` constant with `component` property
- Use `Link` component with `to` prop for navigation

### Convex Backend
- Schema defined in `convex/schema.ts` using `defineSchema()` and `defineTable()`
- Use `@rjdellecese/confect` wrapper for schemas with S.Struct
- Queries use `query()` with S.Struct args/returns
- Mutations use `mutation()` with S.Struct args/returns
- Actions use `action()` for external calls (to TvMaze API)
- System fields `_id` and `_creationTime` are auto-generated
- Indexes using `.index()` on defineTable

### Error Handling (Effect)
- Use Effect (`E.gen`) for async error handling
- Use Option (`O.getOrThrow`) for nullable values
- Parse errors typed as `ParseError`
- Custom errors: `NoSuchElementException`, `NotUniqueError`

### Styling (Tailwind CSS v4)
- Use `@tailwindcss/vite` plugin
- Prefer utility classes over custom CSS
- Use semantic color tokens (text-primary, bg-muted, etc.)
- Use `cn()` helper for conditional classes

### Testing (Vitest)
- Test files: `*.test.ts` or `*.test.tsx`
- Use `it()` or `test()` blocks
- Use async/await, not done callbacks
- Avoid `.only` or `.skip` in committed code

### Accessibility
- Provide meaningful alt text for images
- Use proper heading hierarchy
- Add labels for form inputs
- Include keyboard event handlers alongside mouse events
- Add `rel="noopener"` for `target="_blank"` links

### File Structure Patterns
- `src/components/ui/` - shadcn/ui components
- `src/components/` - app-specific components
- `src/routes/` - TanStack Router file-based routes
- `src/schemas/` - Effect schemas (sShow, sEpisode, etc.)
- `src/functions/` - business logic functions
- `src/lib/` - utilities and helpers
- `convex/` - Convex backend (schema, queries, mutations, actions)

### Security & Best Practices
- Avoid `dangerouslySetInnerHTML`
- Validate user input with Effect schemas
- Don't use `eval()` or assign to `document.cookie`
- Use early returns to reduce nesting
- Remove console.log/debugger/alert from production code

### Performance
- Use `const` by default, `let` only when reassignment needed
- Use top-level regex literals, not in loops
- Avoid spread syntax in loop accumulators
- Use `<Image />` component (or equivalent) over `<img>` tags

### Shadcn UI
- Add components using latest shadcn: `pnpm dlx shadcn@latest add button`
- Use `@base-ui/react` primitives (Button, Dialog, etc.)
- Components use cva for variants with proper typing

## Before Committing

1. Run `pnpm dlx ultracite fix` to auto-fix all formatting/linting issues
2. Run `pnpm test` to ensure tests pass
3. Run `pnpm check` to verify code quality
4. Run `pnpm build` to ensure production build succeeds
