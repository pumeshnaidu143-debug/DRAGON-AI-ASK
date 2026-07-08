import { useMemo } from "react";

// Lightweight markdown renderer with syntax-agnostic code fences.
export default function Markdown({ text }) {
  const html = useMemo(() => render(text || ""), [text]);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function render(src) {
  // extract fenced code blocks first
  const blocks = [];
  src = src.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = blocks.length;
    blocks.push({ lang: lang || "", code });
    return "\\BLOCK" + i + "\\";
  });

  // inline code
  src = escapeHtml(src);
  src = src.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // headings
  src = src.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  src = src.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  src = src.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // bold / italic
  src = src.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  src = src.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  // lists (simple)
  src = src.replace(/^(?:- |\* )(.+)$/gm, "<li>$1</li>");
  src = src.replace(/(<li>[\s\S]+?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");

  // links
  src = src.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // paragraphs (double newline)
  src = src
    .split(/\n{2,}/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      if (t.startsWith("<h") || t.startsWith("<ul") || t.startsWith("<pre") || t.startsWith("\BLOCK") || t.startsWith("<blockquote")) return t;
      return `<p>${t.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  // restore code blocks
  src = src.replace(/\\\BLOCK(\d+)\\/g, (_, i) => {
    const b = blocks[Number(i)];
    return `<pre><code data-lang="${b.lang}">${escapeHtml(b.code)}</code></pre>`;
  });

  return src;
}
