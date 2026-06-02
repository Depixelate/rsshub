/**
 * Parses a small dotenv-compatible file.
 *
 * This intentionally supports only the common `KEY=value` shape used by this
 * project so secret syncing stays predictable. Use it for local `.env` files
 * that feed GitHub secret synchronization, not as a general dotenv parser.
 *
 * @param source Dotenv file contents.
 * @returns Parsed names and values.
 * @throws Error when a non-empty, non-comment line is not `KEY=value`.
 */
export function parseDotenv(source: string): Record<string, string> {
    const values: Record<string, string> = {};

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }

        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) {
            throw new Error(`Invalid dotenv line: ${rawLine}`);
        }

        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        values[match[1]] = value;
    }

    return values;
}

/**
 * Selects allowlisted environment variables and reports missing names.
 *
 * Use this before syncing secrets so only explicitly approved names can leave
 * the local machine. Empty strings are treated as missing to avoid publishing
 * unusable secrets.
 *
 * @param env Parsed environment values.
 * @param allowlist Names that are allowed to be exported.
 * @returns Exportable values and missing names.
 */
export function selectEnv(env: Record<string, string>, allowlist: string[]): { values: Record<string, string>; missing: string[] } {
    const values: Record<string, string> = {};
    const missing: string[] = [];

    for (const key of allowlist) {
        if (Object.hasOwn(env, key) && env[key] !== '') {
            values[key] = env[key];
        } else {
            missing.push(key);
        }
    }

    return { values, missing };
}
