import { Footer } from '@/components/footer';
import { baseOptions, homeLinks } from '@/lib/layout.shared';
import { HomeLayout } from 'fumadocs-ui/layouts/home';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()} links={homeLinks}>
      {children}
      <Footer />
    </HomeLayout>
  );
}
