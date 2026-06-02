import YAML from 'yaml';

/**
 * A custom-route smoke-test entry.
 */
export type SmokeRoute = {
    name: string;
    url: string;
    source?: string;
    expectedStatus: number;
    contains?: string;
    requiredEnv: string[];
};

/**
 * A parsed custom-route smoke-test manifest.
 */
export type SmokeManifest = {
    routes: SmokeRoute[];
};

/**
 * Parses and validates the custom route smoke-test manifest.
 *
 * The manifest is intentionally small: each route must provide an absolute
 * RSSHub path, and optional checks can assert status, required environment, and
 * a body substring. Invalid manifests throw before any HTTP requests run.
 *
 * @param source YAML manifest contents.
 * @returns Parsed smoke-test manifest.
 * @throws Error when `routes` is missing or a route entry is malformed.
 */
export function parseSmokeManifest(source: string): SmokeManifest {
    const parsed = (YAML.parse(source) ?? {}) as { routes?: unknown[] };
    if (!Array.isArray(parsed.routes)) {
        throw new TypeError('smoke-tests.yml must contain a routes array');
    }

    return {
        routes: parsed.routes.map((route, index) => {
            if (!route || typeof route !== 'object') {
                throw new TypeError(`routes[${index}] must be an object`);
            }

            const candidate = route as {
                contains?: unknown;
                expected_status?: unknown;
                name?: unknown;
                required_env?: unknown;
                source?: unknown;
                url?: unknown;
            };

            if (!candidate.url || typeof candidate.url !== 'string') {
                throw new Error(`routes[${index}].url is required`);
            }
            if (!candidate.url.startsWith('/')) {
                throw new Error(`routes[${index}].url must start with /`);
            }

            return {
                name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : candidate.url,
                url: candidate.url,
                source: typeof candidate.source === 'string' ? candidate.source : undefined,
                expectedStatus: Number.isInteger(candidate.expected_status) ? candidate.expected_status : 200,
                contains: typeof candidate.contains === 'string' ? candidate.contains : undefined,
                requiredEnv: Array.isArray(candidate.required_env) ? candidate.required_env.filter((value): value is string => typeof value === 'string' && value.trim()).toSorted() : [],
            };
        }),
    };
}

/**
 * Collects required environment variable names from a smoke-test manifest.
 *
 * Use this when a command needs the complete environment contract for every
 * smoke-tested route, such as reporting setup requirements before a deploy.
 *
 * @param manifest Parsed smoke manifest.
 * @returns Sorted unique environment variable names.
 */
export function collectRequiredEnv(manifest: SmokeManifest): string[] {
    return [...new Set(manifest.routes.flatMap((route) => route.requiredEnv))].toSorted();
}
