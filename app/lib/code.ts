import type { Liturgy, RecitationWithId, SongsBlock, SongWithId } from "./schemas";

function isEmpty(block: Liturgy["blocks"][number]) {
  return block.type === "openDoors" && block.data.title.trim() === "";
}

function getSong(data: SongsBlock["data"]["items"][number], songs: SongWithId[]) {
  const song = songs.find((song) => song.id === data.id);

  if (!song) {
    return null;
  }

  return { ...song, lyrics: data.lyrics || song.lyrics };
}

export function generateCode({
  date,
  liturgy,
  songs,
  recitations,
}: {
  date: Date;
  liturgy: Liturgy;
  songs: SongWithId[];
  recitations: RecitationWithId[];
}) {
  const slides = liturgy.blocks.reduce<unknown[]>((acc, block) => {
    const { type } = block;

    if (isEmpty(block)) {
      return acc;
    }

    if (type === "songs") {
      return acc.concat(
        block.data.items.map((data) => ({
          type: "song",
          data: { ...data, ...getSong(data, songs) },
        })),
      );
    }

    if (type === "recitation") {
      return acc.concat({
        type: "recitation",
        data: recitations.find((recitation) => recitation.id === block.data.id),
      });
    }

    if (type === "reading") {
      return acc.concat(
        block.data.bibleRefs.map((data) => ({
          type: "verse",
          data,
        })),
      );
    }

    return acc.concat(block);
  }, []);

  return JSON.stringify(
    {
      date: date,
      slides,
    },
    null,
    "  ",
  );
}
