/**
 * Scaffolds a new personal RSSHub route and adds it to the smoke manifest.
 *
 * This command refuses to overwrite existing route files, creates missing route
 * directories, and inserts a starter smoke-test entry so new routes are tracked
 * by CI immediately.
 */
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9][a-z0-9/-]*[a-z0-9]$/.test(slug)) {
    throw new Error('Usage: pnpm depixelate:new-route site/path-name');
}

const routePath = path.join('lib/routes/depixelate', `${slug}.ts`);
if (fs.existsSync(routePath)) {
    throw new Error(`${routePath} already exists`);
}

fs.mkdirSync(path.dirname(routePath), { recursive: true });
fs.writeFileSync(
    routePath,
    `import type { Data, Route } from '@/types';

export const route: Route = {
    name: '${titleCase(slug)}',
    path: '/${slug}',
    example: '/depixelate/${slug}',
    maintainers: ['Depixelate'],
    categories: ['other'],

    async handler() {
        return {
            title: '${titleCase(slug)}',
            link: 'https://example.com',
            item: [],
            allowEmpty: true,
        } satisfies Data;
    },
};
`
);

const smokePath = 'depixelate/smoke-tests.yml';
const entry = `
    - name: ${titleCase(slug)}
      url: /depixelate/${slug}
      source: https://example.com
      expected_status: 200
      contains: ${titleCase(slug)}
      required_env: []
`;

if (fs.existsSync(smokePath)) {
    fs.appendFileSync(smokePath, entry);
} else {
    fs.mkdirSync(path.dirname(smokePath), { recursive: true });
    fs.writeFileSync(smokePath, `routes:\n${entry}`);
}

process.stdout.write(`Created ${routePath} and updated ${smokePath}\n`);

/**
 * Converts a route slug into a readable default route/feed title.
 *
 * @param value Route slug such as `site/path-name`.
 * @returns Space-separated title-cased words.
 */
function titleCase(value: string): string {
    return value
        .split(/[/-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
