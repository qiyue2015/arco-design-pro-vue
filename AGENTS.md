# Repository Guidelines

## Project Structure & Release Model

`arco-design-pro-vite/` is the source template and primary maintenance entry. Application code and assets are under `src/`, Vite configuration under `config/`, and generators under `scripts/`.

The two directories under `examples/` are downstream release products, not ordinary examples:

- `pnpm gen:vite` generates the full edition at `examples/arco-design-pro-vite/`.
- `pnpm gen:vite-simple` generates the simple edition at `examples/arco-design-pro-vite-simple/`. It uses `simpleOptions` and `/** simple **/` blocks in `scripts/vite.js` to remove selected pages, APIs, routes, and marked code.

Both editions are independent releases. `release-version.json` is their only version source. A `main` push checks both tags: an unchanged version exits; a new version generates and validates both before publishing either.

## Upstream Sync & Remote Ownership

`origin` owns this customized template (`git@github.com:qiyue2015/arco-design-pro-vue.git`); local `main` tracks `origin/main`. `upstream` is the official repository (`git@github.com:arco-design/arco-design-pro-vue.git`) and is only for reviewing official updates. Preserve local customizations during integration and push to `origin`, never `upstream`. Release repositories have independent remotes.

## Upstream Compatibility & Local Patches

Treat the upstream implementation as the default and keep long-lived differences small and reviewable. Avoid unrelated refactors, bulk formatting, directory reshaping, broad rewrites, or dependency churn in upstream-owned code. Modify upstream code only for a clear local requirement, a generation or release need, or a reproducible upstream defect. Prefer existing configuration and extension points when they remain simpler, but do not add indirection solely to avoid touching an upstream file. Keep necessary changes narrow, semantic, and regression-tested. Structure upstream bug fixes so they can be contributed upstream and removed after an acceptable official fix lands. During upstream integration, re-evaluate overlapping local patches instead of preserving them mechanically.

## Development & Generation Workflow

Run application commands from `arco-design-pro-vite/`:

- `pnpm install`; `pnpm dev` starts Vite.
- `pnpm type:check`; `pnpm build` creates `dist/`.
- `pnpm format`; `pnpm new` scaffolds a feature.

Make reusable changes in the source template, not as long-lived generated-product edits. Before local generation, check Git status in the root and both release repositories; never overwrite uncommitted work. The normal flow is: review `upstream`, integrate while preserving customizations, modify and verify the template, then push to `origin/main`. When `release-version.json` changes, Actions generates both editions in temporary directories, validates both, and directly commits/tags each changed release without force-push. Do not use manual workflow dispatch, GitHub Releases, or hand-created tags as triggers.

Each release repository owns `.github/workflows/pages.yml` and deploys its GitHub Pages URL after `main` pushes. Keep this workflow out of template generation and preserve `.github` during synchronization.

## Coding Style & Naming

Prettier uses two spaces, semicolons, single quotes, and a 128-character width. ESLint covers TypeScript/Vue; Stylelint covers Vue/Less/CSS. Use kebab-case directories, PascalCase components, and camelCase identifiers. Keep views, APIs, routes, and locales aligned.

## Verification, Commits & Pull Requests

No coverage threshold is configured. Run `node --test scripts/release/release-automation.test.mjs`, then type-check/build each edition and browser-smoke affected routes. Release commits use `.release-source.json` to record the version, full template SHA, previous release, and subsequent non-merge commit subjects.

Commitlint enforces Conventional Commits, such as `feat: add authentication flow`. Keep commits repository-scoped. Pull requests need context, verification, related issues, changelog entries, and breaking-change notes.
