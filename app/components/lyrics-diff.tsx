import type { Lyrics } from "@liturgy-maker/shared";
import { cn } from "cn";
import { diffArrays, diffWordsWithSpace } from "diff";

import { prepareLyrics } from "@/lib/lyrics-utils";

type Line = { text: string; chorus: boolean };
type DiffLine = Line & {
  kind: "unchanged" | "removed" | "added";
  counterpart?: string;
};

function toLines(lyrics: Lyrics): Line[] {
  return prepareLyrics(lyrics).flatMap(({ type, lines }, index) => [
    ...(index > 0 ? [{ text: "", chorus: false }] : []),
    ...lines.map((text) => ({ text, chorus: type === "chorus" })),
  ]);
}

function matchChangedLines(removed: Line[], added: Line[]) {
  if (removed.length === 1 && added.length === 1 && removed[0].text && added[0].text) {
    return {
      oldMatches: new Map([[0, added[0].text]]),
      newMatches: new Map([[0, removed[0].text]]),
    };
  }

  const scores = removed.map((oldLine) =>
    added.map((newLine) => {
      const length = Math.max(
        oldLine.text.replace(/\s/g, "").length,
        newLine.text.replace(/\s/g, "").length,
      );
      if (length === 0) return 0;
      const common = diffWordsWithSpace(oldLine.text, newLine.text)
        .filter((part) => !part.added && !part.removed)
        .reduce((sum, part) => sum + part.value.replace(/\s/g, "").length, 0);
      const similarity = common / length;
      return similarity >= 0.2 ? similarity : 0;
    }),
  );
  const best = Array.from({ length: removed.length + 1 }, () =>
    Array<number>(added.length + 1).fill(0),
  );
  for (let i = removed.length - 1; i >= 0; i--) {
    for (let j = added.length - 1; j >= 0; j--) {
      best[i][j] = Math.max(
        best[i + 1][j],
        best[i][j + 1],
        scores[i][j] > 0 ? scores[i][j] + best[i + 1][j + 1] : 0,
      );
    }
  }

  const oldMatches = new Map<number, string>();
  const newMatches = new Map<number, string>();
  let i = 0;
  let j = 0;
  while (i < removed.length && j < added.length) {
    if (scores[i][j] > 0 && best[i][j] === scores[i][j] + best[i + 1][j + 1]) {
      oldMatches.set(i, added[j].text);
      newMatches.set(j, removed[i].text);
      i++;
      j++;
    } else if (best[i + 1][j] >= best[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { oldMatches, newMatches };
}

function compareLines(original: Line[], modified: Line[]): DiffLine[] {
  const changes = diffArrays(
    original.map((line) => line.text),
    modified.map((line) => line.text),
  );
  const result: DiffLine[] = [];
  let originalIndex = 0;
  let modifiedIndex = 0;

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index];
    if (change.removed) {
      const next = changes[index + 1];
      const addedCount = next?.added ? next.value.length : 0;
      const removed = original.slice(originalIndex, originalIndex + change.value.length);
      const added = modified.slice(modifiedIndex, modifiedIndex + addedCount);
      const { oldMatches, newMatches } = matchChangedLines(removed, added);
      removed.forEach((line, offset) =>
        result.push({ ...line, kind: "removed", counterpart: oldMatches.get(offset) }),
      );
      added.forEach((line, offset) =>
        result.push({ ...line, kind: "added", counterpart: newMatches.get(offset) }),
      );
      originalIndex += change.value.length;
      modifiedIndex += addedCount;
      if (addedCount > 0) index++;
    } else if (change.added) {
      change.value.forEach((_, offset) => {
        result.push({
          ...modified[modifiedIndex + offset],
          kind: "added",
        });
      });
      modifiedIndex += change.value.length;
    } else {
      change.value.forEach((_, offset) => {
        result.push({ ...modified[modifiedIndex + offset], kind: "unchanged" });
      });
      originalIndex += change.value.length;
      modifiedIndex += change.value.length;
    }
  }
  return result;
}

function LineText({ line }: { line: DiffLine }) {
  if (line.kind === "unchanged" || line.counterpart === undefined) {
    return line.text;
  }

  const oldText = line.kind === "removed" ? line.text : line.counterpart;
  const newText = line.kind === "added" ? line.text : line.counterpart;
  return diffWordsWithSpace(oldText, newText).map((part, index) => {
    if ((line.kind === "removed" && part.added) || (line.kind === "added" && part.removed)) {
      return null;
    }
    return part.added || part.removed ? (
      <mark
        key={index}
        className={cn(
          "text-inherit",
          line.kind === "removed" ? "bg-red-300 dark:bg-red-800" : "bg-green-300 dark:bg-green-800",
        )}
      >
        {part.value}
      </mark>
    ) : (
      part.value
    );
  });
}

function LyricsDiff({ original, modified }: { original: Lyrics; modified: Lyrics }) {
  const lines = compareLines(toLines(original), toLines(modified));

  return (
    <div>
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn(
            "relative min-h-lh pl-10 -indent-4 whitespace-pre-wrap sm:tracking-wide",
            line.chorus && "pl-14",
            line.kind === "removed" &&
              "bg-red-100 text-red-950 line-through dark:bg-red-950 dark:text-red-100",
            line.kind === "added" &&
              "bg-green-100 text-green-950 dark:bg-green-950 dark:text-green-100",
          )}
        >
          {line.kind !== "unchanged" && (
            <>
              <span className="sr-only">
                {line.kind === "removed" ? "Ligne supprimée : " : "Ligne ajoutée : "}
              </span>
              <span aria-hidden="true" className="absolute left-1 indent-0">
                {line.kind === "removed" ? "−" : "+"}
              </span>
            </>
          )}
          <LineText line={line} />
        </div>
      ))}
    </div>
  );
}

export { LyricsDiff };
