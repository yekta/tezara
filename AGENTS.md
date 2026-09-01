## What is this?

Tezara ([tezara.org](https://tezara.org)) is a search and metadata analysis platform for theses in the YÖK National Thesis Center. It crawls YÖK's system, cleans the data, and serves it with fast search, advanced filtering, per-university statistics, and bulk CSV/JSON export. This is the monorepo for it (pnpm workspaces + Turborepo, Node >= 22). It has no association with YÖK.

## Repo Structure:

### 1- apps/web

The Next.js (App Router, Turbopack) UI and server. tRPC, Tanstack Query/Table/Virtual, Zod, nuqs, Jotai, react-hook-form, and a shadcn/ui + Tailwind design system. Search is backed by Meilisearch, statistics by ClickHouse, caching by Redis (ioredis).

### 2- apps/crawler

The crawler that scrapes YÖK's thesis center (Playwright + cheerio), cleans the data, and syncs it into Meilisearch and ClickHouse. Keeps its state in Redis. Also contains maintenance entrypoints: `backfill`, `migrate`, `probe`, `wipe`, `import-redis-state`. Runs TypeScript directly via `node --experimental-strip-types`.

### 3- packages/

Shared workspace packages, exported as raw TypeScript (no build step):

- `packages/core`: shared types, Zod schemas, and the data-cleaning logic for thesis records.
- `packages/meili`: Meilisearch client, index settings, sync, and index compaction.
- `packages/clickhouse`: ClickHouse client, schema, migrations, aggregates, and sync.

## Commands

Run from the repo root:

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` — via Turbo, across the workspace.
- `pnpm web <script>` and `pnpm crawler <script>` — shortcuts to run scripts in a specific app.

Tests use the Node built-in test runner (`*.test.ts` next to the source), not a test framework.

## General Rules:

- Keep it simple. Do not overcomplicate things.
- Follow each package's own conventions. For example apps/web has a design system and a certain way of doing things, follow it as much as possible.
- The crawler, the sync packages, and the web app are tightly coupled through the shared schemas in `packages/core`. When you change one side, be mindful of the consequences for the others.
- YÖK's raw data is dirty (names with embedded URLs, `null` prefixes, invalid years). Data cleaning lives in `packages/core` — clean at ingest time, don't work around dirty data downstream.
- Be respectful toward YÖK's servers in crawler changes: no aggressive concurrency or retry storms.
- Do not start editing code in response to a question. We'll tell you when to edit code.
- Do not leave paragraphs of comments on top of the code. You should try to avoid them as much as possible with understandable function names and code. If they are necessary even then, make them concise. Remove such comments when you come by them in the codebase. Comments should always move with code, not be left behind.
- Use guard statement patterns in any code you write.
- Do not write any useless tests, tests should cover input output validation — not trivial things.
- If we are missing a glaring issue when we ask you to do something, do not hesitate to point it out.
- Reinvent the wheel but do not reinvent the car. If you are solving a simple problem do not introduce a library. If you are solving a complex but a common problem, there is likely a modern library for it, if so, use it.
- Dependency versions are mostly pinned, and `pnpm-workspace.yaml` carries supply-chain guards (`minimumReleaseAge`, `allowBuilds`). Don't loosen these; when adding a dependency, keep installs non-interactive.
- Never commit or push code unless explicitly asked to do so.
- Never make a PR unless explicitly asked to do so.
- Do not insert yourself into our code, commits or PRs in any way. Our codebase is not your ad space.
- After you make code changes, run lint and typecheck and fix any issues that arise.

## Commit Messages

Commit messages start with the part of the monorepo they touched (`web`, `crawler`, `core`, `meili`, `clickhouse`), followed by a short explanation of the work:

- `web: Exclude bot traffic from metrics`
- `crawler: Compact Meili indexes during crawling`

For changes spanning multiple parts, use the one where the main work happened.

The title should be concise. Description should explain the work in more detail (only if required) while still being concise. Use simple language, do not try to sound smart.
