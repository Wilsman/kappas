# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Key folders: `components/`, `hooks/`, `services/` (API clients, e.g., `src/services/tarkovApi.ts`), `utils/`, `types/`, `data/`.
- `public/`: Static assets served as-is (favicons, images).
- `index.html`: Vite entry at repository root.
- `dist/`: Production build output (generated).
- Config: `vite.config.ts` (alias `@` -> `src`), `tailwind.config.js`, `eslint.config.js`, `tsconfig*.json`, `netlify.toml`.
- Import alias example: `import { SEO } from '@/components/SEO'`.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Build to `dist/`.
- `npm run preview`: Serve the built app locally.
- `npm run lint`: Run ESLint across the repo.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run Vitest once (CI-friendly).
- `npm run test:coverage`: Generate coverage report.

## Coding Style & Naming Conventions
- TypeScript + React; 2-space indentation.
- Components: `PascalCase.tsx` (one component per file when reasonable).
- Hooks: `useX.ts`; utilities: `camelCase.ts`; types: `PascalCase.ts`.
- Prefer named exports; keep modules focused and small.
- Linting: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`. Fix lint errors before PRs.
- Use alias `@` for imports (e.g., `@/components/TaskStats`).

## Testing Guidelines
- Framework: Vitest with V8 coverage.
- Locations: `src/**/__tests__/*.spec.ts(x)` or co-located `*.spec.ts(x)`.
- Mock network with `vi.fn()`; assert API shapes and error paths (see `src/services/__tests__/tarkovApi.spec.ts`).
- Prioritize tests for `services/` and `utils/`.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `style:`, `chore:` (scopes allowed, e.g., `feat(services): add caching`).
- PRs include description, linked issues, screenshots/GIFs for UI changes, and validation steps.
- Quality gate: `npm run lint` and `npm run test:run` must pass; include coverage output for risky changes.

## Security & Configuration Tips
- Never commit secrets. Use `VITE_*` vars in `.env.local` and read via `import.meta.env`.
- Keep network logic in `services/`; avoid embedding keys in UI code.
- Netlify deploys: see `netlify.toml` for redirects and build.

## Architecture Overview
- Vite + React + TypeScript; `index.html` mounts `src/App.tsx` via `src/main.tsx`.
- API layer: `src/services/tarkovApi.ts` calls `https://api.tarkov.dev/graphql` and normalizes results.
- Caching: `localStorage` with TTL (`API_CACHE_KEY`, `API_CACHE_TTL_MS`).
- Alias: `@` resolves to `src/` for clean imports.

## Agent-Specific Instructions
- Keep patches minimal and focused; follow naming and style.
- Update or add tests when changing `services/`/`utils/`; mock `fetch`.
- Avoid introducing new tooling without discussion; update this file if conventions change.

