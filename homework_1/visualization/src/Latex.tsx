import katex from 'katex';
import { useMemo } from 'react';

function renderLatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false, strict: false, output: 'html' });
  } catch {
    return latex;
  }
}

const SEGMENT = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;

export function Latex({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const nodes: (string | { html: string })[] = [];
    let lastIndex = 0;
    for (const match of text.matchAll(SEGMENT)) {
      if (match.index! > lastIndex) nodes.push(text.slice(lastIndex, match.index));
      const latex = match[1] ?? match[2] ?? '';
      nodes.push({ html: renderLatex(latex, match[1] !== undefined) });
      lastIndex = match.index! + match[0].length;
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes;
  }, [text]);
  return <span className={className}>{parts.map((part, index) => typeof part === 'string' ? part : <span key={index} className="latex-inline" dangerouslySetInnerHTML={{ __html: part.html }} />)}</span>;
}
