import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import { renderPlaceholder } from 'fumadocs-core/mdx-plugins/remark-llms.runtime';
import { getPageTreePeers } from 'fumadocs-core/page-tree';
import { llms, loader } from 'fumadocs-core/source';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';
import { docsRoute } from './shared';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: {
        // Keep the code blocks of package manager tabs, not the tab names.
        filterElement(node) {
          if (node.type !== 'mdxJsxFlowElement') return true;
          switch (node.name) {
            case 'CodeBlockTabsList':
              return false;
            case 'CodeBlockTabs':
            case 'CodeBlockTab':
              return 'children-only';
            default:
              return true;
          }
        },
        mdxAsPlaceholder: ['DocsCategory'],
      },
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});

export const docsLlms = llms(source, {
  async renderPage(page) {
    const content = await renderPlaceholder(
      await page.data.getText('processed'),
      {
        // The pages of a section, as its overview page lists them.
        DocsCategory: () =>
          getPageTreePeers(source.getPageTree(), page.url)
            .map((peer) => `- [${peer.name}](${peer.url})`)
            .join('\n'),
      }
    );
    return [
      `# ${page.data.title} (${page.url})`,
      page.data.description,
      content.trim(),
    ]
      .filter(Boolean)
      .join('\n\n')
      .concat('\n');
  },
});

interface DescribedPage {
  description?: string;
  structuredData: StructuredData;
}

/**
 * Describe a page that has no `description` by its first paragraph, or by its
 * first heading when it starts with one, as Docusaurus did.
 */
export function getPageDescription(data: DescribedPage): string | undefined {
  if (data.description) return data.description;
  const { contents, headings } = data.structuredData;
  const text =
    contents.find((content) => content.heading === undefined)?.content ??
    headings[0]?.content;
  return text && toPlainText(text);
}

/**
 * Code spans, emphasis and escapes that structured data keeps as Markdown.
 */
const inlineMarkdown = /(`+)(.+?)\1|(\*\*?)(?!\s)(.+?)(?<!\s)\3|\\(.)/g;

function toPlainText(markdown: string): string {
  return markdown.replace(
    inlineMarkdown,
    (_, ticks, code, marker, inner, escaped) => {
      if (ticks) return code;
      if (marker) return toPlainText(inner);
      return escaped;
    }
  );
}
