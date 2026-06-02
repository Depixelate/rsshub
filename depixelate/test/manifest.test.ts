import { describe, expect, it } from 'vitest';

import { collectRequiredEnv, parseSmokeManifest } from '../scripts/lib/manifest';

describe('smoke-test manifest helpers', () => {
    it('returns routes and defaults expected status to 200', () => {
        const manifest = parseSmokeManifest(`
routes:
  - name: Adaption Labs blog
    url: /depixelate/adaptionlabs/blog
    source: https://adaptionlabs.ai/blog
    contains: Introducing
`);

        expect(manifest.routes).toHaveLength(1);
        expect(manifest.routes[0].expectedStatus).toBe(200);
        expect(manifest.routes[0].url).toBe('/depixelate/adaptionlabs/blog');
    });

    it('deduplicates required env names in sorted order', () => {
        const manifest = parseSmokeManifest(`
routes:
  - name: First
    url: /depixelate/first
    required_env:
      - COOKIE_B
      - COOKIE_A
  - name: Second
    url: /depixelate/second
    required_env:
      - COOKIE_A
`);

        expect(collectRequiredEnv(manifest)).toEqual(['COOKIE_A', 'COOKIE_B']);
    });

    it('rejects missing route urls', () => {
        expect(() =>
            parseSmokeManifest(`
routes:
  - name: Broken
`)
        ).toThrow(/routes\[0\]\.url/);
    });
});
