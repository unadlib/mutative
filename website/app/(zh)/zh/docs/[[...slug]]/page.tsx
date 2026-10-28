import { DocsContent, docsMetadata } from '@/components/pages/docs';
import { source } from '@/lib/source';
type Props = { params: Promise<{ slug?: string[] }> };
export default async function Page({ params }: Props) {
  return <DocsContent slug={(await params).slug} locale="zh" />;
}
export function generateStaticParams() {
  return source.getPages('zh').map((page) => ({ slug: page.slugs }));
}
export async function generateMetadata({ params }: Props) {
  return docsMetadata((await params).slug, 'zh');
}
