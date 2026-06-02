import type { Namespace } from '@/types';

/**
 * Describes the reserved namespace for Depixelate-owned personal routes.
 *
 * RSSHub reads this object during route-registry generation and uses it for
 * route documentation and category metadata. Keep personal routes under this
 * namespace to avoid collisions with upstream RSSHub routes.
 */
export const namespace: Namespace = {
    name: 'Depixelate',
    url: 'github.com/Depixelate/rsshub',
    description: 'Personal RSSHub routes maintained by Depixelate.',
    lang: 'en',
};
