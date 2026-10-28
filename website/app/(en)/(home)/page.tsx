import { HomePage } from '@/components/pages/home';
import { createMetadata } from '@/lib/metadata';
export const metadata = createMetadata(
  { alternates: { canonical: '/' } },
  'en'
);
export default function Page() {
  return <HomePage locale="en" />;
}
