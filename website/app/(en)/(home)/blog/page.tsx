import { BlogList, blogMetadata } from '@/components/pages/blog';
export const metadata = blogMetadata('en');
export default function Page() {
  return <BlogList locale="en" />;
}
