/* eslint-disable regexp/no-super-linear-backtracking */

import { deburr } from "radashi";

import { books } from "./bible-books";

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
  const exprs = [
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

  if (!data || !bookNames.includes(deburr(data.book))) {
    return false;
  }

  const { chapterStart, chapterEnd = chapterStart, verseStart, verseEnd = verseStart } = data;

  if (chapterStart > chapterEnd) {
    return false;
  }

  if (verseStart && verseEnd && chapterStart === chapterEnd && verseStart > verseEnd) {
    return false;
  }

  return true;
}
