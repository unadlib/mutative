import { getFeed } from '@/lib/feed';

export const revalidate = false;

export function GET() {
  return new Response(getFeed('atom', 'zh'), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
}
