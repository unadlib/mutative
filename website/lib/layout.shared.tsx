import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { appName, githubUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/img/logo.svg"
            alt=""
            width={24}
            height={24}
            loading="eager"
          />
          {appName}
        </>
      ),
    },
    githubUrl,
  };
}
