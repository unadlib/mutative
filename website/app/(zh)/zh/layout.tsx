import { Provider } from '@/components/provider';
import { createMetadata, metadataBase } from '@/lib/metadata';
import { speedups } from '@/lib/benchmarks';
import '../../global.css';

export const metadata = {
  metadataBase,
  icons: '/img/favicon.ico',
  ...createMetadata(
    {
      title: {
        default: 'Mutative - 高效的 JavaScript 不可变更新库',
        template: '%s | Mutative',
      },
      description: `高效的不可变更新：相同配置下约为 Immer 的 ${speedups.matched.factor} 倍性能，各自默认配置下约为 ${speedups.defaults.factor} 倍。`,
    },
    'zh'
  ),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider locale="zh">{children}</Provider>
      </body>
    </html>
  );
}
