export interface FeedItem
{
    title: string;
    link: string;
}

export interface Feed
{
    title: string;
    items: FeedItem[];
}

const text = (el: Element | null | undefined) => el?.textContent?.trim() ?? '';

/** Reads an RSS 2.0 or Atom feed; null if the text isn't a feed. */
export function parseFeed(xml: string): Feed | null
{
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    const channel = doc.querySelector('rss > channel, rdf\\:RDF > channel, channel');
    if (channel)
    {
        const items = [...doc.querySelectorAll('item')].map(item => ({
            title: text(item.querySelector('title')),
            link: text(item.querySelector('link')),
        }));
        return { title: text(channel.querySelector(':scope > title')), items: items.filter(i => i.title) };
    }

    const feed = doc.querySelector('feed');
    if (feed)
    {
        const items = [...feed.querySelectorAll('entry')].map(entry =>
        {
            const links = [...entry.querySelectorAll('link')];
            const link = links.find(l => (l.getAttribute('rel') ?? 'alternate') === 'alternate') ?? links[0];
            return { title: text(entry.querySelector('title')), link: link?.getAttribute('href') ?? '' };
        });
        return { title: text(feed.querySelector(':scope > title')), items: items.filter(i => i.title) };
    }

    return null;
}
