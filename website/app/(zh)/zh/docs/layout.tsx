import { baseOptions, releasesLink } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree('zh')}
      {...baseOptions('zh')}
      links={[{ text: '博客', url: '/zh/blog' }, releasesLink('zh')]}
    >
      {children}
    </DocsLayout>
  );
}
