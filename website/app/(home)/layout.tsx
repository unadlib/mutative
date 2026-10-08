import { baseOptions } from '@/lib/layout.shared';
import { HomeLayout } from 'fumadocs-ui/layouts/home';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          text: 'Docs',
          url: '/docs/intro',
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
