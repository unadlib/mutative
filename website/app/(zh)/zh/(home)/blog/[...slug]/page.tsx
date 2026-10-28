import { BlogPostContent, postMetadata } from '@/components/pages/post';
import { blog } from '@/lib/blog';
type Props = { params: Promise<{ slug: string[] }> };
export default async function Page({ params }: Props) {
  return <BlogPostContent slug={(await params).slug} locale="zh" />;
}
export function generateStaticParams() {
  return blog.getPages('zh').map((page) => ({ slug: page.slugs }));
}
export async function generateMetadata({ params }: Props) {
  return postMetadata((await params).slug, 'zh');
}
