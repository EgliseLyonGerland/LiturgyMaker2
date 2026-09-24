import { uid } from "uid";
import * as v from "valibot";

import { liturgyDocumentVersion } from "@/config";

import {
  announcementsBlockSchema,
  liturgySchema,
  openDoorsBlockSchema,
  readingBlockSchema,
  recitationBlockSchema,
  sectionBlockSchema,
  sermonBlockSchema,
  songsBlockSchema,
  type LiturgyBlockType,
} from "./schemas";

export function createDefaultAnnouncementsBlock(): v.InferOutput<typeof announcementsBlockSchema> {
  return {
    type: "announcements",
    data: {
      items: [{ title: "", detail: "" }],
    },
  };
}

export function createDefaultReadingBlock({ title = "" } = {}): v.InferOutput<
  typeof readingBlockSchema
> {
  return {
    type: "reading",
    data: {
      title,
      bibleRefs: [
        {
          id: "",
          excerpt: "",
        },
      ],
    },
  };
}

export function createDefaultSermonBlock(): v.InferOutput<typeof sermonBlockSchema> {
  return {
    type: "sermon",
    data: {
      title: "",
      author: "",
      bibleRefs: [{ id: "" }],
      plan: [{ text: "" }],
    },
  };
}

export function createDefaultOpenDoorsBlock(): v.InferOutput<typeof openDoorsBlockSchema> {
  return {
    type: "openDoors",
    data: {
      title: "",
      detail: "",
      prayerTopics: [{ text: "" }],
    },
  };
}

export function createDefaultSectionBlock({ title = "" } = {}): v.InferOutput<
  typeof sectionBlockSchema
> {
  return {
    type: "section",
    data: {
      title,
    },
  };
}

export function createDefaultSongsBlock(): v.InferOutput<typeof songsBlockSchema> {
  return {
    type: "songs",
    data: {
      items: [],
    },
  };
}

export function createDefaultRecitationBlock(): v.InferOutput<typeof recitationBlockSchema> {
  return {
    type: "recitation",
    data: {
      id: "",
      infos: "",
    },
  };
}

const functions = {
  announcements: createDefaultAnnouncementsBlock,
  reading: createDefaultReadingBlock,
  sermon: createDefaultSermonBlock,
  openDoors: createDefaultOpenDoorsBlock,
  section: createDefaultSectionBlock,
  songs: createDefaultSongsBlock,
  recitation: createDefaultRecitationBlock,
} as const;

export function createDefaultBlock<T extends LiturgyBlockType>(
  type: T,
  ...args: Parameters<(typeof functions)[T]>
) {
  return functions[type](...args);
}

export function createDefaultLiturgy(id: string): v.InferOutput<typeof liturgySchema> {
  return {
    uid: "",
    version: liturgyDocumentVersion,
    blocks: [
      createDefaultAnnouncementsBlock(),
      createDefaultReadingBlock({ title: "Ouverture" }),
      createDefaultReadingBlock({ title: "Loi de Dieu" }),
      createDefaultReadingBlock({ title: "Grâce de Dieu" }),
      createDefaultReadingBlock({ title: "Inter-chants" }),
      createDefaultSermonBlock(),
      createDefaultSongsBlock(),
      createDefaultSectionBlock({ title: "Sainte cène" }),
      createDefaultOpenDoorsBlock(),
      createDefaultSongsBlock(),
      createDefaultReadingBlock({ title: "Envoi" }),
    ],
  };
}
