# Contributing to Aeroliths

First off, thanks for taking the time to contribute! Aeroliths is a web-based
remake of the Skystones minigame from Skylanders, and contributions of all
kinds are welcome - bug reports, feature ideas, documentation, and code.

This guide explains how to get a development environment running and the
conventions we follow.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Coding Conventions](#coding-conventions)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [License](#license)

## Code of Conduct

Be respectful and constructive. We want Aeroliths to be a welcoming project for
everyone. Harassment, personal attacks, or discriminatory language are not
tolerated. If you run into a problem, open an issue or contact a maintainer.

## Ways to Contribute

- **Report a bug** you found while playing or browsing the app.
- **Suggest a feature** or an improvement to an existing one.
- **Improve the documentation** (README, this file, code comments).
- **Submit code** - fix a bug, build a feature, add tests.

If you plan to work on something non-trivial, please open an issue first so we
can discuss the approach before you invest time in a pull request.

## Reporting Bugs & Requesting Features

Use the [GitHub issue tracker](https://github.com/Aeroliths/Aeroliths/issues).

A good bug report includes:

- What you did (steps to reproduce).
- What you expected to happen.
- What actually happened (errors, screenshots, console output).
- Your environment (browser, OS, Node version) when relevant.

Before opening a new issue, search existing ones to avoid duplicates.

## Development Setup

### Prerequisites

- **Node.js 20+** (CI runs against Node 20 and 22)
- **PostgreSQL** and **ArangoDB** - either installed locally or run via the
  provided Docker setup in [`docker/`](docker/)

### 1. Get the code

If you have write access to the repository, clone it directly:

```bash
git clone https://github.com/Aeroliths/Aeroliths.git
cd Aeroliths
```

Otherwise, **fork** the repository on GitHub first (this creates a copy under
your own account), then clone your fork - replace `YOUR-USERNAME` with your
GitHub username:

```bash
git clone https://github.com/YOUR-USERNAME/Aeroliths.git
cd Aeroliths
```

### 2. Install dependencies

```bash
npm install
```

> If you hit peer-dependency errors, use `npm install --legacy-peer-deps`
> (this is the flag CI uses).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in `.env`. A few notes:

- `DATABASE_URL` / `ARANGO_*` - connection details for PostgreSQL and ArangoDB.
  For local development, point these at the Docker stack started in the next
  step (PostgreSQL on `localhost:5544`, ArangoDB on `http://localhost:8530`).
- `JWT_SECRET` - any sufficiently random string for local development.
- `HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET` - the values in `.env.example` are
  hCaptcha's public test keys, which always pass; replace them only for
  production.
- `ADMIN_*` - credentials for the default admin account created on seed.
- `RESEND_API_KEY` / `EMAIL_FROM` - needed for transactional email features.

### 4. Start the local databases (Docker)

The development databases run via the Docker stack in [`docker/`](docker/). It
provides PostgreSQL (`localhost:5544`), ArangoDB (`localhost:8530`), and Adminer
(a DB GUI at `localhost:8080`). **Start it before running Prisma or the dev
server**, since both need the databases to be up:

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 5. Set up the database

With the containers running:

```bash
npm run prisma:generate   # Generate the Prisma client
npm run prisma:migrate     # Apply migrations (dev)
npm run prisma:seed        # Seed initial data + default admin
```

### 6. Run the dev server

```bash
npm run dev
```

The app is served at `http://localhost:3000`.

> The Docker stack above is for **local development** (databases only). For
> running the full app in production with Docker, see the [README](README.md).

## Project Structure

```
app/        Nuxt frontend - pages, components, composables, assets (CSS)
server/     Nitro backend - API routes (server/api), utils, middleware
prisma/     Prisma schema, migrations, and seed script
tests/      Vitest tests, mirroring the server/api structure
docker/     Local development Docker configuration
public/     Static assets served as-is
```

## Testing

Tests are written with [Vitest](https://vitest.dev/) and live in
[`tests/`](tests/), mirroring the `server/api/` directory layout.

```bash
npm run test           # Watch mode
npm run test:run       # Run once (what CI runs)
npm run test:coverage  # With coverage
npm run test:ui        # Vitest UI
```

When you add or change an API endpoint, please add or update the corresponding
test. CI runs the full suite on Node 20 and 22, so make sure
`npm run test:run` passes locally before opening a PR.

## Coding Conventions

- The codebase is **TypeScript** throughout. Prefer typed code over `any`.
- Vue components use the **`<script setup>`** Composition API.
- Match the style of the surrounding code - naming, file layout, and patterns
  already in use. When in doubt, look at a similar existing file.
- Keep the README and code comments in **English**, consistent with the rest of
  the project.
- Run a production build to catch type and SSR issues before submitting:

  ```bash
  npm run build
  ```

  CI gates merges on a successful build, so this should pass locally too.

## Commit Messages

This project follows the
[Conventional Commits](https://www.conventionalcommits.org/) style. Use a type
prefix followed by a short, imperative summary:

```
feat: add news page
fix: prevent admin stats crash on the month period
style: update report page in admin panel
test: add coverage for user reports endpoints
chore(deps): bump hono
docs: document environment variables
refactor: extract image upload helper
```

Common types: `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `chore`.
Keep each commit focused on a single logical change.

## Pull Request Process

1. Create a branch off `master` with a descriptive name
   (e.g. `feat/online-matchmaking`, `fix/month-chart-crash`).
2. Make your changes in focused, well-described commits.
3. Ensure `npm run test:run` and `npm run build` both pass locally.
4. Push your branch and open a pull request **against `master`**.
5. Fill in the PR description: what changed, why, and how to test it. Link any
   related issue (e.g. `Closes #123`).
6. Make sure CI is green. A maintainer will review your PR and may request
   changes before merging.

Keep pull requests reasonably small and scoped to one concern - it makes review
faster and merges smoother.

## License

Aeroliths is open source. By contributing, you agree that your contributions
will be licensed under the same terms as the project. Refer to the repository
for the applicable license.

---

Thanks again for contributing to Aeroliths!
