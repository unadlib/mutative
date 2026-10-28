import Link from 'next/link';
import { Footer } from '@/components/footer';
import { baseOptions, homeLinks } from '@/lib/layout.shared';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
export default function NotFound() {
  return (
    <HomeLayout {...baseOptions('zh')} links={homeLinks('zh')}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
        <h1 className="text-6xl font-bold text-fd-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">页面未找到</h2>
        <p className="max-w-md text-fd-muted-foreground">
          你查找的页面可能已被删除、改名或暂时无法访问。
        </p>
        <Link
          href="/zh/"
          className="mt-4 rounded-lg bg-fd-primary px-4 py-2 text-fd-primary-foreground"
        >
          返回中文首页
        </Link>
      </div>
      <Footer locale="zh" />
    </HomeLayout>
  );
}
