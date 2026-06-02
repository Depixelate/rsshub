/**
 * Closes open CI-failure issues after the latest workflow run succeeds.
 *
 * The workflow uses this as a recovery signal so old build/smoke issues do not
 * stay open once the custom RSSHub image is publishing successfully again.
 */
import { execFileSync } from 'node:child_process';

const repo = process.env.GITHUB_REPOSITORY ?? 'Depixelate/rsshub';
const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'unknown run';
let issues: Array<{ number: number; title: string }> = [];

try {
    issues = JSON.parse(execFileSync('gh', ['issue', 'list', '--repo', repo, '--state', 'open', '--label', 'ci-failure', '--json', 'number,title'], { encoding: 'utf8' })) as Array<{ number: number; title: string }>;
} catch {
    process.exit(0);
}

for (const issue of issues) {
    execFileSync('gh', ['issue', 'comment', String(issue.number), '--repo', repo, '--body', `Recovered in ${runUrl}`], { stdio: 'inherit' });
    execFileSync('gh', ['issue', 'close', String(issue.number), '--repo', repo, '--comment', 'Closing because the latest candidate build, publish, and smoke tests passed.'], { stdio: 'inherit' });
}
