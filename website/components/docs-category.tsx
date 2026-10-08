import { getPageDescription, source } from '@/lib/source';
import { getPageTreePeers } from 'fumadocs-core/page-tree';
import { Card, Cards } from 'fumadocs-ui/components/card';

/**
 * Cards for the other pages of a section, as on the Docusaurus category pages.
 */
export function DocsCategory({ url }: { url: string }) {
  return (
    <Cards>
      {getPageTreePeers(source.getPageTree(), url).map((peer) => {
        const page = source.getNodePage(peer);
        const description = page && getPageDescription(page.data);
        return (
          <Card key={peer.url} title={peer.name} href={peer.url}>
            {description && <span className="line-clamp-2">{description}</span>}
          </Card>
        );
      })}
    </Cards>
  );
}
