# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript source. Key folders: `components/`, `hooks/`, `services/` (API clients, e.g., `src/services/tarkovApi.ts`), `utils/`, `types/`, `data/`.
- `public/`: Static assets served as-is; `index.html` entry.
- `dist/`: Production build output (generated).
- Config: `vite.config.ts` (alias `@` -> `src`), `tailwind.config.js`, `eslint.config.js`, `tsconfig*.json`, `netlify.toml`.
- Import alias example: `import { Something } from '@/components/Something'`.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Build production bundle to `dist/`.
- `npm run preview`: Serve the built app locally.
- `npm run lint`: Run ESLint across the repo.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run Vitest once (CI-friendly).
- `npm run test:coverage`: Run tests with coverage reporting.

## Coding Style & Naming Conventions
- Language: TypeScript + React. Indentation: 2 spaces.
- Components: `PascalCase.tsx` (one component per file when reasonable).
- Hooks: `useX.ts`. Utilities: `camelCase.ts`. Types: `PascalCase.ts` for exported types.
- Prefer named exports; keep modules focused.
- Linting: ESLint (`@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`). Fix lint errors before PRs.

## Testing Guidelines
- Framework: Vitest with V8 coverage. Example tests in `src/services/__tests__/tarkovApi.spec.ts`.
- Locations: `src/**/__tests__/*.spec.ts(x)` or co-locate as `*.spec.ts(x)` next to code.
- Practices: Unit-test `services/` and `utils/`; mock `fetch` with `vi.fn()`; assert API shapes and error paths.
- Aim for meaningful coverage, especially around data fetching and parsing.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `style:`, `chore:` (optionally scoped, e.g., `feat(services): …`).
- PRs must include: concise description, linked issues, screenshots/GIFs for UI changes, and steps to validate.
- Quality gate: `npm run lint` and `npm run test:run` must pass; include coverage output for risky changes.

## Security & Configuration Tips
- Do not commit secrets. If introducing config, use `VITE_*` vars in `.env.local` and read via `import.meta.env`.
- Keep network logic in `services/`; avoid embedding sensitive keys in client code.
- Netlify: adjust redirects/headers in `netlify.toml` as needed for deploys.

## Architecture Overview
- App shell: Vite + React + TypeScript; entry via `index.html` and `src/main.tsx` mounting `src/App.tsx`.
- Modules: UI in `components/`; cross-cutting helpers in `utils/` and `hooks/`; API layer in `services/`.
- Data fetching: `src/services/tarkovApi.ts` calls `https://api.tarkov.dev/graphql` and normalizes results.
- Caching: lightweight `localStorage` cache with TTL (`API_CACHE_KEY`, `API_CACHE_TTL_MS`).
- Aliases: `@` resolves to `src/` for cleaner imports.
