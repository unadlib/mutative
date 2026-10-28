import { baseOptions, releasesLink } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree('en')}
      {...baseOptions('en')}
      links={[{ text: 'Blog', url: '/blog' }, releasesLink('en')]}
    >
      {children}
    </DocsLayout>
  );
}
