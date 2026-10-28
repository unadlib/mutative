import { DocsContent, docsMetadata } from '@/components/pages/docs';
import { source } from '@/lib/source';
type Props = { params: Promise<{ slug?: string[] }> };
export default async function Page({ params }: Props) {
  return <DocsContent slug={(await params).slug} locale="en" />;
}
export function generateStaticParams() {
  return source.getPages('en').map((page) => ({ slug: page.slugs }));
}
export async function generateMetadata({ params }: Props) {
  return docsMetadata((await params).slug, 'en');
}
