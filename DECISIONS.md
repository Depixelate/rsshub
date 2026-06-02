# Project Decisions

This file records decisions made for the Depixelate RSSHub fork.

## Full RSSHub Fork

- Decision: use a real public fork of `DIYgod/RSSHub` as `Depixelate/rsshub`.
- Why: a full fork gives normal local IDE support, RSSHub TypeScript aliases, source builds, route registry generation, and Docker builds without generated `.work` checkouts or hard links.

## Archived Overlay Repo

- Decision: rename the old overlay repository to `Depixelate/rsshub-overlay-old` and archive it publicly.
- Why: the old history remains available, while the canonical `Depixelate/rsshub` name is freed for the real RSSHub fork.

## Branch Topology

- Decision: keep `master` as a clean mirror of `DIYgod/RSSHub/master` and use `depixelate/custom` as the default production branch.
- Why: this separates upstream mirroring from custom route work while keeping local development to one normal checkout.

## Custom Route Location

- Decision: keep custom route files directly under `lib/routes/depixelate`.
- Why: RSSHub automatically loads routes under `lib/routes`, so this gives the cleanest build, registry, and IDE behavior.

## Custom Namespace

- Decision: all personal routes stay under `/depixelate/...`.
- Why: a reserved namespace avoids collisions when upstream RSSHub adds or changes official routes.

## Depixelate Support Files

- Decision: keep custom manifests, helper scripts, tests, and docs under `depixelate/`.
- Why: route code belongs in RSSHub's route tree, while project-specific automation should remain visibly separate from upstream-owned files.

## Package Manager

- Decision: use RSSHub's existing pnpm/Corepack setup for Depixelate helper scripts and tests.
- Why: the full fork already declares pnpm, and a second npm-based package would reintroduce split tooling.

## CI Candidate Images

- Decision: every same-repo PR into `depixelate/custom` builds and smoke-tests `ghcr.io/depixelate/rsshub:candidate-pr-<number>`.
- Why: PR checks should prove the actual Docker image works before the PR is eligible to merge or publish.

## Digest Promotion

- Decision: after a PR merges, promote the tested candidate image digest to `latest` and `source-<tested-pr-head-sha>`.
- Why: production should receive the same image that smoke tests passed, without a duplicate Docker build.

## Image Tags

- Decision: publish only `latest` and `source-<tested-pr-head-sha>` as production tags.
- Why: `latest` supports Watchtower deployment and `source-<sha>` gives precise rollback/debug traceability without ambiguous upstream tag semantics.

## Candidate Cleanup

- Decision: delete `candidate-pr-<number>` after successful promotion.
- Why: candidate tags are temporary handoff names and should not clutter GHCR once production tags point at the tested digest.

## Upstream Sync Automation

- Decision: run upstream sync daily and on manual dispatch.
- Why: daily updates keep RSSHub current without excessive CI churn, and manual dispatch gives an immediate update path.

## Upstream Sync Merge Method

- Decision: use GitHub auto-merge for upstream-sync PRs.
- Why: it is GitHub-native and automatic. The tradeoff is that the merge commit SHA can differ from the tested PR head SHA, so image tags use the tested PR head SHA.

## Manual PR Policy

- Decision: manual route/code PRs require a human merge, but publish automatically after merge if candidate checks passed.
- Why: user-authored changes should get a review checkpoint, while deployment should still be automatic after acceptance.

## Branch Protection Enforcement

- Decision: rely on branch protection to require the `build-smoke-candidate` check before PRs can merge.
- Why: branch protection is the intended GitHub enforcement point, and the publish workflow can remain simple by promoting merged PR candidates.

## GitHub App Bot

- Decision: use a GitHub App token for upstream-sync branch and PR automation.
- Why: GitHub restricts workflow recursion from plain `GITHUB_TOKEN`; a GitHub App provides a clean bot identity and short-lived tokens.

## Secret Policy

- Decision: secret values stay only in local deployment `.env` files and GitHub Actions secrets.
- Why: the repo and image are public, so credentials must never appear in source, image layers, logs, or docs.

## Deployment Folder

- Decision: keep `/home/shuddown/rsshub-deploy` unchanged.
- Why: the migration changes source and CI architecture, not the runtime Compose layout or Watchtower image reference.

## Documentation Policy

- Decision: keep README, DECISIONS.md, AGENTS.md, and architecture docs updated as first-class project artifacts.
- Why: future Codex sessions and human edits need decisions and constraints without relying on chat history.
