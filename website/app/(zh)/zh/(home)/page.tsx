import { HomePage } from '@/components/pages/home';
import { createMetadata } from '@/lib/metadata';
export const metadata = createMetadata(
  { alternates: { canonical: '/zh/' } },
  'zh'
);
export default function Page() {
  return <HomePage locale="zh" />;
}
