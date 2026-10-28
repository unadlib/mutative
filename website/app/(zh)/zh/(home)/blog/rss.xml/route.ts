import { getFeed } from '@/lib/feed';

export const revalidate = false;

export function GET() {
  return new Response(getFeed('rss', 'zh'), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
