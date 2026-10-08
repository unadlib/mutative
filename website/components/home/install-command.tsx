'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const command = 'npm install mutative';

export function InstallCommand() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="inline-flex items-center gap-3 rounded-xl border bg-fd-card/80 py-2 ps-4 pe-2 font-mono text-sm shadow-sm backdrop-blur">
      <span className="select-none text-fd-muted-foreground">$</span>
      <code>{command}</code>
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy the install command'}
        className="rounded-md p-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        onClick={() => {
          void navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
