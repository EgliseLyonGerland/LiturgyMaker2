import * as v from "valibot";

import { liturgyDocumentVersion, maxPrayerTopics } from "@/config";

import { validate } from "./bible";

const bibleRefSchema = v.pipe(
  v.string(),
  v.trim(),
  v.union([
    v.literal(""),
    v.pipe(
      v.string(),
      v.check((ref) => validate(ref), "Format de référence invalide"),
    ),
  ]),
);

const lyricsSchema = v.array(
  v.object({
    type: v.picklist(["verse", "chorus"]),
    text: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty("Ce passage ne peut pas être vide"),
      v.check(
        (text) => text.split(/\r\n|\r|\n/).length <= 8,
        "Ce passage ne peut pas dépasser 8 lignes",
      ),
    ),
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
        lyrics: v.fallback(lyricsSchema, []),
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
    prayerTopics: v.pipe(
      v.array(
        v.object({
          text: v.string(),
        }),
      ),
      v.maxLength(maxPrayerTopics),
      v.minLength(1),
    ),
  }),
});

const liturgySchema = v.object({
  uid: v.string(),
  version: v.literal(liturgyDocumentVersion),
  revision: v.optional(v.string()),
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
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Le titre est requis")),
  aka: v.fallback(v.string(), ""),
  authors: v.fallback(v.string(), ""),
  number: v.fallback(v.number(), 0),
  copyright: v.fallback(v.string(), ""),
  translation: v.fallback(v.string(), ""),
  collection: v.fallback(v.string(), ""),
  previewUrl: v.fallback(
    v.union([v.literal(""), v.pipe(v.string(), v.url("L’URL de l’aperçu est invalide"))]),
    "",
  ),
  lyrics: v.fallback(lyricsSchema, []),
});

const recitationContentSchema = v.array(
  v.object({
    text: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty("Ce passage ne peut pas être vide"),
      v.check(
        (text) => text.split(/\r\n|\r|\n/).length <= 8,
        "Ce passage ne peut pas dépasser 8 lignes",
      ),
    ),
  }),
);

const recitationSchema = v.object({
  title: v.string(),
  content: v.fallback(recitationContentSchema, []),
});

type Liturgy = v.InferOutput<typeof liturgySchema>;
type LiturgyWithId = Liturgy & { id: string };

type LiturgyBlocks = {
  announcements: AnnouncementsBlock;
  reading: ReadingBlock;
  section: SectionBlock;
  sermon: SermonBlock;
  songs: SongsBlock;
  recitation: RecitationBlock;
  openDoors: OpenDoorsBlock;
};

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
type SongWithId = v.InferOutput<typeof songSchema> & { id: string };
type Recitation = v.InferOutput<typeof recitationSchema>;
type RecitationWithId = v.InferOutput<typeof recitationSchema> & { id: string };
type RecitationContent = v.InferOutput<typeof recitationContentSchema>;

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
  recitationSchema,
  recitationContentSchema,
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
  LiturgyWithId,
  LiturgyBlocks,
  LiturgyBlockType,
  Song,
  SongWithId,
  Recitation,
  RecitationWithId,
  RecitationContent,
};
