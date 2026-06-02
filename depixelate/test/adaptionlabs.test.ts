import { describe, expect, it } from 'vitest';

import { extractAdaptionPosts } from '../../lib/routes/depixelate/adaptionlabs/utils';

describe('extractAdaptionPosts', () => {
    it('reads embedded Next.js posts data', () => {
        const html = String.raw`<script>self.__next_f.push([1,"{\"posts\":[{\"authors\":[{\"name\":\"Sara Hooker\"}],\"createdAt\":\"2026-05-18T12:00:34.146Z\",\"imageUrl\":\"https://cdn.example/post.jpg\",\"readingTime\":\"2min read\",\"slug\":\"publicsector-grant\",\"title\":\"Introducing the Public Sector Grant\",\"titlePreview\":\"Introducing the Public Sector Grant\",\"topics\":[\"Featured Story\"]}]}"])</script>`;

        const posts = extractAdaptionPosts(html);

        expect(posts).toHaveLength(1);
        expect(posts[0].slug).toBe('publicsector-grant');
        expect(posts[0].title).toBe('Introducing the Public Sector Grant');
        expect(posts[0].authors?.map((author) => author.name)).toEqual(['Sara Hooker']);
    });

    it('throws a useful error when no posts are embedded', () => {
        expect(() => extractAdaptionPosts('<html></html>')).toThrow(/Could not find embedded posts/);
    });
});
