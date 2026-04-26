# Repository Guidelines

## Project Structure & Module Organization

This repository contains a single React + TypeScript Vite app in `moneytrax-app/`.

- `moneytrax-app/src/` holds application source.
- `moneytrax-app/src/components/` contains reusable React components such as `Source`, `Account`, and `AnimatedStream`.
- `moneytrax-app/src/types/` contains shared TypeScript types.
- `moneytrax-app/src/assets/` and `moneytrax-app/public/` hold static assets.
- Build and tool configuration live in `moneytrax-app/package.json`, `vite.config.ts`, `tsconfig*.json`, and `eslint.config.js`.

There is currently no dedicated test directory.

## Build, Test, and Development Commands

Run commands from `moneytrax-app/`:

```bash
npm ci
npm run dev
npm run build
npm run lint
npm run preview
```

- `npm ci` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Vite development server.
- `npm run build` type-checks with `tsc -b` and builds the production bundle.
- `npm run lint` runs ESLint over the app.
- `npm run preview` serves the production build locally.

No `npm test` script is defined yet.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Match the existing code style: 2-space indentation, semicolons, single quotes, and named exports for components. Name React components in `PascalCase` (`AnimatedStream.tsx`) and shared types with clear domain names in `src/types/`.

Keep component state local unless data needs to be shared. Prefer explicit types for exported values and props. Avoid unrelated refactors when changing behavior.

## Testing Guidelines

Automated tests are not configured. For now, verify changes with:

```bash
npm run build
npm run lint
```

When adding tests, prefer behavior-focused component or integration tests. Place tests near the code they cover or in a clearly named test directory, and use names that describe behavior, such as `Account.displaysBalance.test.tsx`.

## Commit & Pull Request Guidelines

Git history currently uses short, descriptive commit messages such as `Initial commit` and `Fixed animation`. Keep commits focused and use concise imperative or past-tense summaries.

Pull requests should include a short description, verification steps run, and screenshots or screen recordings for visible UI changes. Link related issues when available and call out any follow-up work or known limitations.

## Agent-Specific Instructions

Make the smallest correct change. Do not modify more than four files without first breaking the task into smaller steps. Verify facts against the current repository state before documenting commands, tools, or conventions.
