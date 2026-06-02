/**
 * Opens or updates rolling GitHub issues for failed Depixelate CI runs.
 *
 * Route smoke failures are deduplicated by route URL. Earlier failures use a
 * build-wide title supplied by `FAILURE_TITLE` or a safe default.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY ?? 'Depixelate/rsshub';
const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'unknown run';
const defaultTitle = process.env.FAILURE_TITLE ?? 'Build failure: Depixelate RSSHub image';

ensureLabel('ci-failure', 'b60205', 'Automated CI failure report');

if (fs.existsSync('smoke-results.json')) {
    const report = JSON.parse(fs.readFileSync('smoke-results.json', 'utf8')) as {
        results: Array<{
            ok: boolean;
            error?: string;
            route: {
                source?: string;
                url: string;
            };
        }>;
    };
    const failures = report.results.filter((result) => !result.ok);
    for (const failure of failures) {
        upsertIssue(`Smoke failure: ${failure.route.url}`, [`Route: \`${failure.route.url}\``, `Source: ${failure.route.source ?? 'n/a'}`, `Error: ${failure.error ?? 'unknown'}`, `Run: ${runUrl}`].join('\n\n'));
    }
    if (failures.length) {
        process.exit(0);
    }
}

upsertIssue(defaultTitle, ['The Depixelate RSSHub workflow failed before route smoke tests completed.', `Run: ${runUrl}`].join('\n\n'));

/**
 * Creates a rolling issue or comments on the existing open issue.
 *
 * @param title Stable issue title used as the dedupe key.
 * @param body Failure details to put in the new issue or comment.
 */
function upsertIssue(title: string, body: string): void {
    const existing = JSON.parse(execFileSync('gh', ['issue', 'list', '--repo', repo, '--state', 'open', '--label', 'ci-failure', '--json', 'number,title'], { encoding: 'utf8' })) as Array<{ number: number; title: string }>;
    const issue = existing.find((candidate) => candidate.title === title);
    if (issue) {
        execFileSync('gh', ['issue', 'comment', String(issue.number), '--repo', repo, '--body', body], { stdio: 'inherit' });
    } else {
        execFileSync('gh', ['issue', 'create', '--repo', repo, '--title', title, '--body', body, '--label', 'ci-failure'], { stdio: 'inherit' });
    }
}

/**
 * Ensures the CI failure label exists before issue creation.
 *
 * Label creation is best-effort because repository tokens can vary. If the
 * label already exists, or creation is denied, issue creation may still work.
 *
 * @param name Label name.
 * @param color Six-character hex color without `#`.
 * @param description Label description shown in GitHub.
 */
function ensureLabel(name: string, color: string, description: string): void {
    try {
        execFileSync('gh', ['label', 'create', name, '--repo', repo, '--color', color, '--description', description], { stdio: 'ignore' });
    } catch {
        // The label already exists or the token lacks label creation rights; issue creation can still proceed if it exists.
    }
}
