import Link from 'next/link';
import { Footer } from '@/components/footer';
import { baseOptions, homeLinks } from '@/lib/layout.shared';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { DefaultNotFound } from 'fumadocs-ui/layouts/home/not-found';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()} links={homeLinks()}>
      <DefaultNotFound />
      <p className="px-4 pb-10 text-center text-fd-muted-foreground">
        页面未找到。
        <Link href="/zh/" lang="zh-CN" className="underline underline-offset-4">
          返回中文首页
        </Link>
      </p>
      <Footer />
    </HomeLayout>
  );
}
