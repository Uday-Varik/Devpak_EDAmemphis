import { Fragment, type ReactNode } from "react";

/** Inline formatting: **bold** and `code`. Output is React nodes only (no HTML injection). */
const renderInline = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
};

const splitRow = (line: string): string[] =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

/** Converts a small, known subset of Markdown to React elements. */
export const renderMarkdown = (source: string): ReactNode[] => {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed === "---") {
      out.push(<hr key={key++} className="my-6 border-border" />);
      i++;
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const text = renderInline(heading[2]);
      const cls =
        level === 1
          ? "text-3xl font-bold mt-2 mb-4"
          : level === 2
            ? "text-xl font-semibold mt-8 mb-3"
            : "text-base font-semibold mt-6 mb-2";
      out.push(
        level === 1 ? (
          <h1 key={key++} className={cls}>{text}</h1>
        ) : level === 2 ? (
          <h2 key={key++} className={cls}>{text}</h2>
        ) : (
          <h3 key={key++} className={cls}>{text}</h3>
        ),
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(
        <div key={key++} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {header.map((h, c) => (
                  <th key={c} className="border-b border-border px-3 py-2 text-left font-semibold">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, c) => (
                    <td key={c} className="border-b border-border px-3 py-2 align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\./.test(trimmed);
      const items: ReactNode[] = [];
      const itemPattern = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (i < lines.length && itemPattern.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(itemPattern, ""))}</li>);
        i++;
      }
      out.push(
        ordered ? (
          <ol key={key++} className="my-3 list-decimal space-y-1 pl-6">{items}</ol>
        ) : (
          <ul key={key++} className="my-3 list-disc space-y-1 pl-6">{items}</ul>
        ),
      );
      continue;
    }

    // Paragraph: collect consecutive plain lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|[-*]\s|\d+\.\s|\||---$)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(
      <p key={key++} className="my-3 leading-relaxed">
        {renderInline(para.join(" "))}
      </p>,
    );
  }

  return out;
};
