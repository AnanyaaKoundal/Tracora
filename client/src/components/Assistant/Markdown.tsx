'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders the assistant's markdown reply.
 *
 * The model is told to write short markdown (bold bug IDs, bullet lists), so it
 * needs rendering rather than printing as plain text. The component map keeps the
 * output inside the panel's visual language instead of browser defaults.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children: c }) => <p className="whitespace-pre-wrap">{c}</p>,
        strong: ({ children: c }) => (
          <strong className="font-semibold text-slate-900">{c}</strong>
        ),
        em: ({ children: c }) => <em className="italic">{c}</em>,
        ul: ({ children: c }) => (
          <ul className="list-disc space-y-1 pl-4">{c}</ul>
        ),
        ol: ({ children: c }) => (
          <ol className="list-decimal space-y-1 pl-4">{c}</ol>
        ),
        li: ({ children: c }) => <li className="pl-0.5">{c}</li>,
        code: ({ children: c }) => (
          <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs">
            {c}
          </code>
        ),
        a: ({ children: c, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="underline">
            {c}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
