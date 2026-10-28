import { BlogList, blogMetadata } from '@/components/pages/blog';
export const metadata = blogMetadata('zh');
export default function Page() {
  return <BlogList locale="zh" />;
}
