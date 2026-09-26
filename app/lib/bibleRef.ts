/* eslint-disable regexp/no-super-linear-backtracking */

import { deburr, range } from "radashi";

import { books } from "@/config/bible";

interface GetBibleResponse {
  chapter: number;
  verses: {
    chapter: number;
    verse: number;
    name: string;
    text: string;
  }[];
}

interface BibleRef {
  book: string;
  chapterStart: number;
  verseStart: number | undefined;
  chapterEnd: number | undefined;
  verseEnd: number | undefined;
}

const bookNames = books.reduce<string[]>(
  (acc, { name, alt }) =>
    alt ? acc.concat(deburr(name)).concat(deburr(alt)) : acc.concat(deburr(name)),
  [],
);

export function parse(ref: string): BibleRef | null {
  /**
   * Examples:
   *
   *  - 1 Pierre
   *  - 1 Pierre 15
   *  - 1 Pierre 15-16
   *  - 1 Pierre 15.3
   *  - 1 Pierre 15.3-8
   *  - 1 Pierre 15.3-16.8
   */
  const exprs = [
    // {
    //   regExp: /^(.+?)$/,
    //   fields: ["book"]
    // },
    /^(?<book>.+?) *(?<chapterStart>\d+)$/,
    /^(?<book>.+?) *(?<chapterStart>\d+)-(?<chapterEnd>\d+)$/,
    /^(?<book>.+?) *(?<chapterStart>\d+)\.(?<verseStart>\d+[a-z]?)$/,
    /^(?<book>.+?) *(?<chapterStart>\d+)\.(?<verseStart>\d+[a-z]?)-(?<verseEnd>\d+[a-z]?)$/,
    /^(?<book>.+?) *(?<chapterStart>\d+)\.(?<verseStart>\d+[a-z]?)-(?<chapterEnd>\d+)\.(?<verseEnd>\d+[a-z]?)$/,
  ];

  return exprs.reverse().reduce<BibleRef | null>((acc, regExp) => {
    if (acc) {
      return acc;
    }

    const matches = regExp.exec(ref.trim());

    if (!matches || !matches.groups) {
      return null;
    }

    return {
      book: matches.groups.book,
      chapterStart: Number(matches.groups.chapterStart),
      verseStart: Number(matches.groups.verseStart) || undefined,
      chapterEnd: Number(matches.groups.chapterEnd) || undefined,
      verseEnd: Number(matches.groups.verseEnd) || undefined,
    };
  }, null);
}

export function validate(ref: string) {
  const data = parse(ref);

  if (!data) {
    // Format incorrect
    return false;
  }

  if (!bookNames.includes(deburr(data.book))) {
    // Livre non-reconnu
    return false;
  }

  const { chapterStart, chapterEnd = chapterStart, verseStart, verseEnd = verseStart } = data;

  if (chapterStart > chapterEnd) {
    // Le numéro de chapitre de fin est inférieur à celui de début
    return false;
  }

  if (verseStart && verseEnd) {
    if (chapterStart === chapterEnd) {
      if (verseStart > verseEnd) {
        // Le numéro de verset de fin est inférieur à celui de début
        return false;
      }
    }
  }

  return true;
}

function sanitize(text: string) {
  return text.replace(/([^ ])([:;?!])/g, "$1 $2");
}

export async function getPassage(ref: string) {
  const data = parse(ref);

  if (!data || !data.chapterStart) {
    return null;
  }

  const version = "ls1910";
  const bookId = books.findIndex(({ name, alt }) => name === data.book || alt === data.book) + 1;

  if (!bookId) return null;

  const { chapterStart } = data;
  const chapterEnd = data.chapterEnd || chapterStart;
  const verseStart = data.verseStart || 1;
  const verseEnd = data.verseStart ? data.verseEnd || verseStart : Infinity;

  const result = (
    await Promise.all(
      range(chapterStart, chapterEnd + 1, (chapter) =>
        fetch(`https://api.getbible.net/v2/${version}/${bookId}/${chapter}.json`).then((res) =>
          res.ok ? (res.json() as Promise<GetBibleResponse>) : null,
        ),
      ),
    )
  ).reduce((acc, chapter) => {
    if (!chapter) {
      return acc;
    }

    const content = chapter.verses
      .slice(
        chapter.chapter === chapterStart ? verseStart - 1 : 0,
        chapter.chapter === chapterEnd ? verseEnd : chapter.verses.length,
      )
      .map((verse) => verse.text)
      .join("");

    return `${acc}\n\n${content}`.trim();
  }, "");

  return sanitize(result);
}
