import { Footer } from '@/components/footer';
import { baseOptions, homeLinks } from '@/lib/layout.shared';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <HomeLayout {...baseOptions('en')} links={homeLinks('en')}>{children}<Footer locale="en" /></HomeLayout>;
}
