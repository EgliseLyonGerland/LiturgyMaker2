import type { RangeTuple } from "fuse.js";

export function highlightMatches(text: string, regions: readonly RangeTuple[], trim?: number) {
  if (!regions || !regions.length) {
    return text;
  }

  const chunks = [];
  let lastIndex = 0;

  // Fuse.js returns sorted, non-overlapping [start, end] pairs
  for (const [start, end] of regions) {
    // Add any unmatched text before this region
    if (start > lastIndex) {
      let part = text.slice(lastIndex, start);

      if (trim && part.length > trim + 5) {
        if (lastIndex) {
          part = `${part.slice(0, trim / 2).trimEnd()} […] ${part.slice(-trim / 2).trimStart()}`;
        } else {
          part = `[…] ${part.slice(-trim).trimStart()}`;
        }
      }

      chunks.push(part);
    }
    // Wrap the matched range in a <mark> tag
    chunks.push(
      <span key={start} className="border-b border-dashed border-yellow-400 bg-yellow-600/30">
        {text.slice(start, end + 1)}
      </span>,
    );
    lastIndex = end + 1;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    let part = text.slice(lastIndex);

    if (trim && part.length > trim + 4) {
      part = `${part.slice(0, trim)} […]`;
    }

    chunks.push(part);
  }

  return chunks;
}
