import type { Data, DataItem, Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

import { escapeHtml, extractAdaptionPosts } from './utils';

const SITE_URL = 'https://adaptionlabs.ai' as const;
const BLOG_URL = `${SITE_URL}/blog` as const;

/**
 * RSSHub route for the Adaption Labs blog listing.
 *
 * The handler fetches the public blog index, extracts the structured posts
 * array embedded in the Next.js response, and converts those entries into RSS
 * items. It throws when the embedded data cannot be found so CI smoke tests
 * catch site-shape changes instead of silently emitting an empty feed.
 */
export const route: Route = {
    name: 'Adaption Labs Blog',
    path: '/adaptionlabs/blog',
    example: '/depixelate/adaptionlabs/blog',
    maintainers: ['Depixelate'],
    categories: ['blog'],
    description: 'Adaption Labs blog posts from the structured data embedded in the blog page.',

    async handler() {
        const html = await ofetch(BLOG_URL);
        const posts = extractAdaptionPosts(html);

        const item = posts.map((post) => {
            const link = `${BLOG_URL}/${post.slug}`;
            const authors = post.authors?.map((author) => author.name).filter(Boolean) ?? [];
            const metadata = [authors.join(', '), post.readingTime, post.topics?.join(', ')].filter(Boolean);
            const text = metadata.join(' | ');

            return {
                title: post.titlePreview || post.title,
                link,
                guid: link,
                author: authors.join(', '),
                pubDate: post.createdAt ? parseDate(post.createdAt) : undefined,
                category: post.topics,
                image: post.imageUrl,
                description: text,
                content: {
                    html: [post.imageUrl ? `<p><img src="${post.imageUrl}" alt="${escapeHtml(post.title)}"></p>` : '', text ? `<p>${escapeHtml(text)}</p>` : ''].filter(Boolean).join('\n'),
                    text,
                },
            } satisfies DataItem;
        });

        return {
            title: 'Adaption Labs Blog',
            link: BLOG_URL,
            description: 'Product launches, research insights, and community updates from Adaption Labs.',
            language: 'en',
            allowEmpty: false,
            item,
        } satisfies Data;
    },
};
