/**
 * Author data embedded in Adaption Labs' Next.js page payload.
 */
export type AdaptionAuthor = {
    name: string;
};

/**
 * Blog-post metadata embedded in the Adaption Labs blog index page.
 *
 * The source page currently exposes listing metadata only. The route therefore
 * emits title, link, date, authors, topics, image, and reading-time data rather
 * than full article bodies.
 */
export type AdaptionPost = {
    authors?: AdaptionAuthor[];
    createdAt?: string;
    imageUrl?: string;
    readingTime?: string;
    slug: string;
    title: string;
    titlePreview?: string;
    topics?: string[];
};

/**
 * Extracts blog posts from Adaption Labs' embedded Next.js data.
 *
 * Use this when the `/blog` HTML response contains a serialized `posts` prop.
 * The function normalizes common escaping used inside Next.js script payloads,
 * parses the first `posts` array, and filters out malformed entries. It throws
 * when the page no longer contains the expected embedded structure so smoke
 * tests catch site-shape changes instead of silently emitting an empty feed.
 *
 * @param html HTML returned by `https://adaptionlabs.ai/blog`.
 * @returns Valid blog posts with at least a `slug` and `title`.
 */
export function extractAdaptionPosts(html: string): AdaptionPost[] {
    const normalized = html
        .replaceAll(String.raw`\"`, '"')
        .replaceAll(String.raw`\n`, '\n')
        .replaceAll(String.raw`\u0026`, '&');
    const marker = '"posts":';
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex === -1) {
        throw new Error('Could not find embedded posts data in Adaption Labs blog HTML');
    }

    const arrayStart = normalized.indexOf('[', markerIndex + marker.length);
    if (arrayStart === -1) {
        throw new Error('Could not find embedded posts array in Adaption Labs blog HTML');
    }

    const arrayEnd = findJsonArrayEnd(normalized, arrayStart);
    const posts = JSON.parse(normalized.slice(arrayStart, arrayEnd)) as unknown;
    if (!Array.isArray(posts)) {
        throw new TypeError('Embedded Adaption Labs posts data was not an array');
    }

    return posts.filter((post): post is AdaptionPost => Boolean(post) && typeof post === 'object' && typeof (post as AdaptionPost).slug === 'string' && typeof (post as AdaptionPost).title === 'string');
}

/**
 * Escapes text for safe insertion into RSS item HTML snippets.
 *
 * @param value Raw text from the source page.
 * @returns HTML-escaped text.
 */
export function escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/**
 * Finds the exclusive end offset of a JSON array inside a larger string.
 *
 * This small parser is used instead of a regular expression because the posts
 * array can contain nested arrays and quoted strings. It assumes `start` points
 * at the opening `[` and throws when the matching closing bracket is absent.
 *
 * @param source String that contains a JSON array.
 * @param start Index of the opening `[` character.
 * @returns Exclusive end index, suitable for `source.slice(start, end)`.
 */
function findJsonArrayEnd(source: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < source.length; index++) {
        const char = source[index];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        switch (char) {
            case '"':
                inString = true;
                break;

            case '[':
                depth++;
                break;

            case ']':
                depth--;
                if (depth === 0) {
                    return index + 1;
                }
                break;

            default:
                break;
        }
    }

    throw new Error('Could not find the end of the embedded posts array');
}
