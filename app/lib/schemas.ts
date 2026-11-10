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
      v.transform((ref) => ref.replace("Ézékiel", "Ézéchiel")),
      v.check((ref) => validate(ref), "Format de référence invalide"),
    ),
  ]),
);

const lyricsSchema = v.array(
  v.object({
    type: v.picklist(["verse", "chorus"]),
    text: v.string(),
  }),
);

const lyricsFormSchema = v.array(
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

const announcementsBlockFormSchema = announcementsBlockSchema;

const readingBlockSchema = v.object({
  type: v.literal("reading"),
  title: v.string(),
  data: v.object({
    bibleRefs: v.array(
      v.object({
        id: v.string(),
        excerpt: v.string(),
      }),
    ),
  }),
});

const readingBlockFormSchema = v.object({
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

const sectionBlockFormSchema = sectionBlockSchema;

const sermonBlockSchema = v.object({
  type: v.literal("sermon"),
  data: v.object({
    title: v.string(),
    author: v.string(),
    bibleRefs: v.array(
      v.object({
        id: v.string(),
      }),
    ),
    plan: v.array(
      v.object({
        text: v.string(),
      }),
    ),
  }),
});

const sermonBlockFormSchema = v.object({
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
        id: v.nullable(v.string(), ""),
        infos: v.optional(v.string(), ""),
        repeat: v.optional(v.boolean(), false),
        lyrics: v.nullish(lyricsSchema, []),
      }),
    ),
  }),
});

const songsBlockFormSchema = v.object({
  type: v.literal("songs"),
  data: v.object({
    items: v.array(
      v.object({
        id: v.string(),
        infos: v.string(),
        repeat: v.boolean(),
        lyrics: lyricsFormSchema,
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

const recitationBlockFormSchema = recitationBlockSchema;

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

const openDoorsBlockFormSchema = v.object({
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
  uid: v.optional(v.string(), ""),
  version: v.literal(liturgyDocumentVersion),
  date: v.number(),
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

const liturgyFormSchema = v.object({
  uid: v.string(),
  version: v.literal(liturgyDocumentVersion),
  date: v.number(),
  revision: v.optional(v.string()),
  blocks: v.array(
    v.variant("type", [
      announcementsBlockFormSchema,
      readingBlockFormSchema,
      sectionBlockFormSchema,
      sermonBlockFormSchema,
      songsBlockFormSchema,
      recitationBlockFormSchema,
      openDoorsBlockFormSchema,
    ]),
  ),
});

const songSchema = v.object({
  title: v.string(),
  aka: v.nullish(v.string(), ""),
  authors: v.nullish(v.string(), ""),
  number: v.nullish(
    v.pipe(
      v.union([v.number(), v.string()]),
      v.transform((input) => {
        const number = Number(input);

        if (Number.isInteger(number) && number > 0) {
          return `${number}`;
        }

        return "";
      }),
    ),
    "",
  ),
  copyright: v.nullish(v.string(), ""),
  translation: v.nullish(v.string(), ""),
  collection: v.nullish(v.string(), ""),
  previewUrl: v.nullish(v.string(), ""),
  lyrics: v.nullish(lyricsSchema, []),
});

const songFormSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Le titre est requis")),
  aka: v.string(),
  authors: v.string(),
  number: v.union([
    v.literal(""),
    v.pipe(
      v.string(),
      v.trim(),
      v.regex(/^\d+$/, "La position doit être un nombre entier positif"),
    ),
  ]),
  copyright: v.string(),
  translation: v.string(),
  collection: v.string(),
  previewUrl: v.union([v.literal(""), v.pipe(v.string(), v.url("L’URL de l’aperçu est invalide"))]),
  lyrics: lyricsFormSchema,
});

const recitationContentSchema = v.array(
  v.object({
    text: v.string(),
  }),
);

const recitationSchema = v.object({
  title: v.string(),
  content: recitationContentSchema,
});

const recitationFormSchema = v.object({
  title: v.string(),
  content: v.array(
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
  ),
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
type LiturgyForm = v.InferOutput<typeof liturgyFormSchema>;

type Song = v.InferOutput<typeof songSchema>;
type SongWithId = v.InferOutput<typeof songSchema> & { id: string };
type SongForm = v.InferOutput<typeof songFormSchema>;

type Recitation = v.InferOutput<typeof recitationSchema>;
type RecitationWithId = v.InferOutput<typeof recitationSchema> & { id: string };
type RecitationContent = v.InferOutput<typeof recitationContentSchema>;
type RecitationForm = v.InferOutput<typeof recitationFormSchema>;

export {
  lyricsSchema,
  lyricsFormSchema,
  liturgyFormSchema,
  announcementsBlockSchema,
  readingBlockSchema,
  sectionBlockSchema,
  sermonBlockSchema,
  songsBlockSchema,
  recitationBlockSchema,
  openDoorsBlockSchema,
  liturgySchema,
  songSchema,
  songFormSchema,
  recitationSchema,
  recitationContentSchema,
  recitationFormSchema,
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
  LiturgyForm,
  Song,
  SongWithId,
  SongForm,
  Recitation,
  RecitationWithId,
  RecitationContent,
  RecitationForm,
};
