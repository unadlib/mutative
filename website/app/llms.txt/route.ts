import { llmsIndex } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  return new Response(await llmsIndex.index('en'));
}
