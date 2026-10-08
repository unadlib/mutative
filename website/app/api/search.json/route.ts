import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Exported as a static index, searched in the browser.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
