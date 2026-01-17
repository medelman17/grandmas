# Code Style and Conventions

## TypeScript
- Strict mode enabled
- Use interfaces for object shapes (e.g., `interface GrandmaMessageProps`)
- Use type aliases for unions (e.g., `type GrandmaId = "nana-ruth" | ...`)
- Path aliases: `@/*` maps to project root

## React/Next.js Patterns
- Use `"use client"` directive for client components
- Functional components with destructured props
- Custom hooks in `hooks/` directory (e.g., `useCounsel`)
- Components in `components/` directory

## Naming Conventions
- Files: kebab-case (e.g., `grandma-message.tsx`)
- Components: PascalCase (e.g., `GrandmaMessage`)
- Hooks: camelCase with `use` prefix (e.g., `useCounsel`)
- Constants: UPPER_SNAKE_CASE (e.g., `GRANDMA_IDS`)
- Types/Interfaces: PascalCase (e.g., `CounselMessage`)

## Styling
- Tailwind CSS v4 with CSS-first config
- `cn()` utility from `lib/utils.ts` for conditional classes
- Framer Motion for animations
- Component-specific color schemes via grandma configs

## Project Structure
```
app/           # Next.js App Router pages and API routes
  api/chat/    # Edge API route for AI interactions
components/    # React components
hooks/         # Custom React hooks
lib/           # Shared utilities, types, configs
public/        # Static assets
```

## Import Order
1. React/Next.js imports
2. Third-party libraries (framer-motion, etc.)
3. Local utilities (`@/lib/...`)
4. Local components (`@/components/...`)
