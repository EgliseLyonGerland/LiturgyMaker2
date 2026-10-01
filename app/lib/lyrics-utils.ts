import type { Lyrics } from "./schemas";

function sanitize(text: string) {
  return text.trim().replace(/ (.{1,2})$/, " $1");
}

export function prepareLyrics(lyrics: Lyrics) {
  return lyrics.map((part) => ({
    type: part.type,
    lines: part.text
      .split("\n")
      .map(sanitize)
      .filter((line) => line !== ""),
  }));
}

export function isEqualLyrics(a: Lyrics, b: Lyrics) {
  if (a.length !== b.length) {
    return false;
  }

  return !a.some((part, index) => {
    if (part.type !== b[index].type) {
      return true;
    }

    return part.text !== b[index].text;
  });
}
