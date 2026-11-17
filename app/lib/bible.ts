import { books, parse } from "@liturgy-maker/shared";
import { range } from "radashi";

interface GetBibleResponse {
  chapter: number;
  verses: {
    chapter: number;
    verse: number;
    name: string;
    text: string;
  }[];
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
      range(chapterStart, chapterEnd, (chapter) =>
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
