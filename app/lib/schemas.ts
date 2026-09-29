import * as v from "valibot";

import { liturgyDocumentVersion } from "@/config";

import { validate } from "./bible";

const bibleRefSchema = v.pipe(
  v.string(),
  v.check((ref) => validate(ref), "Format de référence invalide"),
);

const lyricsSchema = v.array(
  v.object({
    type: v.picklist(["verse", "chorus"]),
    text: v.string(),
  }),
);

const announcementsBlockSchema = v.object({
  type: v.literal("announcements"),
  data: v.object({
    items: v.array(
      v.object({
        title: v.string(),
        detail: v.string(),
      }),
    ),
  }),
});

const readingBlockSchema = v.object({
  type: v.literal("reading"),
  title: v.string(),
  data: v.object({
    bibleRefs: v.array(
      v.object({
        id: bibleRefSchema,
        excerpt: v.string(),
      }),
    ),
  }),
});

const sectionBlockSchema = v.object({
  type: v.literal("section"),
  data: v.object({
    title: v.string(),
  }),
});

const sermonBlockSchema = v.object({
  type: v.literal("sermon"),
  data: v.object({
    title: v.string(),
    author: v.string(),
    bibleRefs: v.array(
      v.object({
        id: bibleRefSchema,
      }),
    ),
    plan: v.array(
      v.object({
        text: v.string(),
      }),
    ),
  }),
});

const songsBlockSchema = v.object({
  type: v.literal("songs"),
  data: v.object({
    items: v.array(
      v.object({
        id: v.string(),
        infos: v.string(),
        repeat: v.boolean(),
        lyrics: lyricsSchema,
      }),
    ),
  }),
});

const recitationBlockSchema = v.object({
  type: v.literal("recitation"),
  data: v.object({
    id: v.string(),
    infos: v.string(),
  }),
});

const openDoorsBlockSchema = v.object({
  type: v.literal("openDoors"),
  data: v.object({
    title: v.string(),
    detail: v.string(),
    prayerTopics: v.array(
      v.object({
        text: v.string(),
      }),
    ),
  }),
});

const liturgySchema = v.object({
  uid: v.string(),
  version: v.literal(liturgyDocumentVersion),
  blocks: v.array(
    v.variant("type", [
      announcementsBlockSchema,
      readingBlockSchema,
      sectionBlockSchema,
      sermonBlockSchema,
      songsBlockSchema,
      recitationBlockSchema,
      openDoorsBlockSchema,
    ]),
  ),
});

const songSchema = v.object({
  id: v.string(),
  title: v.string(),
  aka: v.string(),
  authors: v.string(),
  number: v.string(),
  copyright: v.string(),
  translation: v.string(),
  collection: v.string(),
  previewUrl: v.pipe(v.string(), v.url()),
  lyrics: lyricsSchema,
});

type Liturgy = v.InferOutput<typeof liturgySchema>;

type Lyrics = v.InferOutput<typeof lyricsSchema>;
type AnnouncementsBlock = v.InferOutput<typeof announcementsBlockSchema>;
type ReadingBlock = v.InferOutput<typeof readingBlockSchema>;
type SectionBlock = v.InferOutput<typeof sectionBlockSchema>;
type SermonBlock = v.InferOutput<typeof sermonBlockSchema>;
type SongsBlock = v.InferOutput<typeof songsBlockSchema>;
type RecitationBlock = v.InferOutput<typeof recitationBlockSchema>;
type OpenDoorsBlock = v.InferOutput<typeof openDoorsBlockSchema>;

type LiturgyBlockType = Liturgy["blocks"][number]["type"];

type Song = v.InferOutput<typeof songSchema>;

export {
  lyricsSchema,
  announcementsBlockSchema,
  readingBlockSchema,
  sectionBlockSchema,
  sermonBlockSchema,
  songsBlockSchema,
  recitationBlockSchema,
  openDoorsBlockSchema,
  liturgySchema,
  songSchema,
};

export type {
  Lyrics,
  AnnouncementsBlock,
  ReadingBlock,
  SectionBlock,
  SermonBlock,
  SongsBlock,
  RecitationBlock,
  OpenDoorsBlock,
  Liturgy,
  LiturgyBlockType,
  Song,
};
