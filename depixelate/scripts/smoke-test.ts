/**
 * Runs HTTP smoke tests for custom RSSHub routes.
 *
 * The command reads `depixelate/smoke-tests.yml`, checks each route against a
 * running RSSHub instance, writes machine-readable results for CI issue
 * reporting, and exits non-zero when any route fails.
 */
import fs from 'node:fs';

import { parseSmokeManifest } from './lib/manifest';

type SmokeResult = {
    route: ReturnType<typeof parseSmokeManifest>['routes'][number];
    ok: boolean;
    status?: number;
    error?: string;
};

const options = parseArgs(process.argv.slice(2));
const baseUrl = options['base-url'] ?? process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:1200';
const manifestPath = options.manifest ?? 'depixelate/smoke-tests.yml';
const resultsPath = options['results-file'] ?? 'smoke-results.json';
const manifest = parseSmokeManifest(fs.readFileSync(manifestPath, 'utf8'));

const results = await Promise.all(manifest.routes.map((route) => testRoute(route)));
const failed = results.some((result) => !result.ok);

fs.writeFileSync(resultsPath, JSON.stringify({ baseUrl, results }, null, 2));

for (const result of results) {
    const prefix = result.ok ? 'PASS' : 'FAIL';
    process.stdout.write(`${prefix} ${result.route.url}${result.status ? ` status=${result.status}` : ''}${result.error ? ` ${result.error}` : ''}\n`);
}

process.exit(failed ? 1 : 0);

/**
 * Runs one smoke-test route against the configured base URL.
 *
 * @param route Route manifest entry to check.
 * @returns Machine-readable smoke result.
 */
async function testRoute(route: SmokeResult['route']): Promise<SmokeResult> {
    const missingEnv = route.requiredEnv.filter((key) => !process.env[key]);
    if (missingEnv.length) {
        return { route, ok: false, error: `Missing required env vars: ${missingEnv.join(', ')}` };
    }

    try {
        const url = new URL(route.url, baseUrl);
        const response = await fetch(url);
        const body = await response.text();
        const statusOk = response.status === route.expectedStatus;
        const containsOk = !route.contains || body.includes(route.contains);
        const ok = statusOk && containsOk;
        return {
            route,
            ok,
            status: response.status,
            error: ok ? undefined : `Expected status ${route.expectedStatus}${route.contains ? ` and body containing ${JSON.stringify(route.contains)}` : ''}`,
        };
    } catch (error) {
        return { route, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Parses simple `--key value` command-line arguments.
 *
 * @param args Process arguments after the script name.
 * @returns Parsed argument map.
 */
function parseArgs(args: string[]): Record<string, string | undefined> {
    const parsed: Record<string, string | undefined> = {};
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (!arg.startsWith('--')) {
            continue;
        }
        const key = arg.slice(2);
        parsed[key] = args[index + 1];
        index++;
    }
    return parsed;
}
