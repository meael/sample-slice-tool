# PRD: GitHub Pages Deployment Setup

## Introduction

Configure the project for automatic deployment to GitHub Pages. The app will be hosted at `username.github.io/sample-slice-tool` and automatically deploy when changes are pushed to the main branch.

## Goals

- Enable automatic deployment to GitHub Pages via GitHub Actions
- Configure Vite base path for subpath hosting (`/sample-slice-tool/`)
- Ensure production build works correctly on GitHub Pages

## User Stories

### US-001: Configure Vite base path for GitHub Pages
**Description:** As a developer, I need the build to use the correct base path so assets load correctly on GitHub Pages.

**Acceptance Criteria:**
- [ ] Update vite.config.ts to set `base: '/sample-slice-tool/'`
- [ ] Production build assets reference the correct subpath
- [ ] Typecheck passes

### US-002: Add GitHub Actions workflow for deployment
**Description:** As a developer, I want automatic deployment to GitHub Pages when I push to main.

**Acceptance Criteria:**
- [ ] Create `.github/workflows/deploy.yml` workflow file
- [ ] Workflow triggers on push to main branch
- [ ] Workflow installs dependencies, builds, and deploys to gh-pages
- [ ] Uses `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`
- [ ] Typecheck passes

### US-003: Create main branch from current state
**Description:** As a developer, I need a main branch to trigger deployments from.

**Acceptance Criteria:**
- [ ] Create `main` branch from current branch (ralph/marker-control-label-refinement)
- [ ] Main branch contains all current features
- [ ] Verify branch exists with `git branch`

## Functional Requirements

- FR-1: Vite config must set `base: '/sample-slice-tool/'` for production builds
- FR-2: GitHub Actions workflow must trigger on push to `main` branch
- FR-3: Workflow must use Node.js 20 and pnpm/npm for builds
- FR-4: Workflow must deploy built `dist/` folder to GitHub Pages

## Non-Goals

- Custom domain configuration
- 404.html for SPA routing (not needed)
- Preview deployments for pull requests
- Creating the GitHub repository (done manually)

## Technical Considerations

- This is a Vite + React project
- GitHub Pages deployment uses the newer GitHub Actions method (not gh-pages branch)
- Base path only needed for production, not development
- Workflow needs `pages` permission for deployment

## Success Metrics

- Push to main triggers automatic build and deploy
- App loads correctly at `username.github.io/sample-slice-tool`
- All assets (JS, CSS, audio files) load without 404 errors

## Open Questions

- None
