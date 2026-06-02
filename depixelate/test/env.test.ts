import { describe, expect, it } from 'vitest';

import { parseDotenv, selectEnv } from '../scripts/lib/env';

describe('environment helpers', () => {
    it('parses unquoted and quoted dotenv values without exposing comments', () => {
        const env = parseDotenv(`
# ignored
PLAIN=value
SPACED = "hello world"
SINGLE='one two'
`);

        expect(env).toEqual({
            PLAIN: 'value',
            SPACED: 'hello world',
            SINGLE: 'one two',
        });
    });

    it('selects allowlisted keys and reports missing keys', () => {
        const selected = selectEnv({ TOKEN: 'abc', OTHER: 'def' }, ['TOKEN', 'COOKIE']);

        expect(selected.values).toEqual({ TOKEN: 'abc' });
        expect(selected.missing).toEqual(['COOKIE']);
    });
});
