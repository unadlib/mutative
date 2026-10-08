import { getFeed } from '@/lib/feed';

export const revalidate = false;

export function GET() {
  return new Response(getFeed('rss'), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
