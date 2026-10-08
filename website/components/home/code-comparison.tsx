import { highlight } from 'fumadocs-core/highlight';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { SectionHeading } from './section-heading';

// The example of the introduction in the docs.
const spreadCode = `const nextState = {
  ...state,
  list: [
    ...state.list.slice(0, 2),
    {
      ...state.list[2],
      done: true,
    },
    { text: 'Learn Mutative', done: true },
  ],
};`;

const mutativeCode = `import { create } from 'mutative';

const nextState = create(state, (draft) => {
  draft.list[2].done = true;
  draft.list.push({ text: 'Learn Mutative', done: true });
});`;

function Code({ code, title }: { code: string; title: string }) {
  return highlight(code, {
    lang: 'ts',
    components: {
      pre: ({ ref: _ref, ...props }) => (
        <CodeBlock
          {...props}
          title={title}
          className={`${props.className ?? ''} my-0`}
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      ),
    },
  });
}

export function CodeComparison() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow="Simple"
        title="Immutable updates without the spread"
      >
        Mark the last item of a list as done and add a new one. With spread
        syntax, you copy each level of the state yourself; with Mutative, you
        change a draft.
      </SectionHeading>
      <div className="mt-12 grid items-start gap-6 lg:grid-cols-[5fr_6fr]">
        {/* Grid items shrink below the width of their code. */}
        <div className="min-w-0">
          <p className="mb-3 text-sm font-medium text-fd-muted-foreground">
            Spread syntax
          </p>
          <Code code={spreadCode} title="reducer.ts" />
        </div>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-medium text-fd-primary">
            With Mutative
          </p>
          <div className="rounded-xl shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fd-primary)_45%,transparent),0_16px_48px_-16px_color-mix(in_oklab,var(--color-fd-primary)_45%,transparent)]">
            <Code code={mutativeCode} title="reducer.ts" />
          </div>
        </div>
      </div>
    </section>
  );
}
