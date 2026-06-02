/**
 * Syncs allowlisted local `.env` values into GitHub Actions secrets.
 *
 * The command requires an explicit allowlist derived from the smoke manifest so
 * accidental environment variables are not uploaded. Use `--dry-run` to inspect
 * what would sync before writing to GitHub.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

import { parseDotenv, selectEnv } from './lib/env';
import { collectRequiredEnv, parseSmokeManifest } from './lib/manifest';

const options = parseArgs(process.argv.slice(2));
const repo = options.repo ?? 'Depixelate/rsshub';
const envPath = options['env-file'] ?? '.env';
const manifestPath = options.manifest ?? 'depixelate/smoke-tests.yml';
const dryRun = Boolean(options['dry-run']);

const manifest = parseSmokeManifest(fs.readFileSync(manifestPath, 'utf8'));
const allowlist = collectRequiredEnv(manifest);
const env = parseDotenv(fs.readFileSync(envPath, 'utf8'));
const selected = selectEnv(env, allowlist);

if (allowlist.length === 0) {
    process.stdout.write('No required_env entries found; no secrets to sync.\n');
    process.exit(0);
}

if (selected.missing.length) {
    throw new Error(`Missing values in ${envPath}: ${selected.missing.join(', ')}`);
}

for (const key of allowlist) {
    if (dryRun) {
        process.stdout.write(`Would sync ${key} to ${repo}\n`);
        continue;
    }
    execFileSync('gh', ['secret', 'set', key, '--repo', repo, '--body', selected.values[key]], { stdio: ['ignore', 'inherit', 'inherit'] });
    process.stdout.write(`Synced ${key} to ${repo}\n`);
}

/**
 * Parses simple `--key value` flags plus the boolean `--dry-run` flag.
 *
 * @param args Process arguments after the script name.
 * @returns Parsed argument map.
 */
function parseArgs(args: string[]): Record<string, boolean | string | undefined> {
    const parsed: Record<string, boolean | string | undefined> = {};
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (!arg.startsWith('--')) {
            continue;
        }
        const key = arg.slice(2);
        if (key === 'dry-run') {
            parsed[key] = true;
        } else {
            parsed[key] = args[index + 1];
            index++;
        }
    }
    return parsed;
}
