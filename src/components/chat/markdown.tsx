"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/** Models often emit \( \) and \[ \] LaTeX delimiters; remark-math expects $ and $$. */
function normalizeMath(text: string) {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, expr: string) => `$${expr.trim()}$`);
}

export const Markdown = memo(function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
          // Generated content never loads remote images.
          img: ({ alt }) => <span className="text-muted-foreground">[{alt || "rasm"}]</span>,
        }}
      >
        {normalizeMath(content)}
      </ReactMarkdown>
    </div>
  );
});
