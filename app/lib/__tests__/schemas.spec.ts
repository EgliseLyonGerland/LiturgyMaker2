import { valibotResolver } from "@hookform/resolvers/valibot";
import { createFormControl } from "react-hook-form";
import * as v from "valibot";
import { describe, expect, it, vi } from "vitest";

import { liturgyDocumentVersion, maxPrayerTopics } from "@/config";

import { createDefaultLiturgy } from "../default-liturgy";
import {
  liturgyFormSchema,
  liturgySchema,
  lyricsFormSchema,
  lyricsSchema,
  recitationFormSchema,
  recitationSchema,
  songFormSchema,
  songSchema,
  type Lyrics,
  type SongForm,
} from "../schemas";

const song: SongForm = {
  title: "Mon chant",
  aka: "",
  authors: "",
  number: "",
  copyright: "",
  translation: "",
  collection: "",
  previewUrl: "",
  lyrics: [],
};

const lines = (count: number, separator = "\n") => Array(count).fill("Line").join(separator);
const defaultLiturgy = createDefaultLiturgy("20261101");

describe("lyrics form validation", () => {
  it.each(["\n", "\r\n", "\r"])("accepts exactly 8 lines separated by %j", (separator) => {
    const lyrics = [{ type: "verse", text: lines(8, separator) }];
    expect(v.parse(lyricsFormSchema, lyrics)).toEqual(lyrics);
  });

  it.each(["\n", "\r\n", "\r"])("rejects 9 lines separated by %j", (separator) => {
    const result = v.safeParse(lyricsFormSchema, [{ type: "chorus", text: lines(9, separator) }]);
    expect(result.success).toBe(false);
    expect(result.issues?.[0].message).toBe("Ce passage ne peut pas dépasser 8 lignes");
    expect(result.issues && v.getDotPath(result.issues[0])).toBe("0.text");
  });

  it.each(["", " \n\t "])("rejects an empty passage: %j", (text) => {
    const result = v.safeParse(lyricsFormSchema, [{ type: "verse", text }]);
    expect(result.success).toBe(false);
    expect(result.issues?.[0].message).toBe("Ce passage ne peut pas être vide");
  });

  it("trims surrounding whitespace before counting lines", () => {
    expect(v.parse(lyricsFormSchema, [{ type: "verse", text: `\n ${lines(8)} \n` }])).toEqual([
      { type: "verse", text: lines(8) },
    ]);
  });

  it("counts internal blank lines", () => {
    expect(
      v.safeParse(lyricsFormSchema, [{ type: "verse", text: `First\n${"\n".repeat(7)}Last` }])
        .success,
    ).toBe(false);
  });

  it("allows no passages and rejects unknown passage types", () => {
    expect(v.parse(lyricsFormSchema, [])).toEqual([]);
    expect(v.safeParse(lyricsFormSchema, [{ type: "bridge", text: "Line" }]).success).toBe(false);
  });

  it("preserves stored lyrics without imposing form constraints", () => {
    const lyrics = [
      { type: "verse", text: "" },
      { type: "chorus", text: ` ${lines(9)} ` },
    ];
    expect(v.parse(lyricsSchema, lyrics)).toEqual(lyrics);
    expect(v.safeParse(lyricsFormSchema, lyrics).success).toBe(false);
  });

  it("blocks handleSubmit and exposes the passage error through the resolver", async () => {
    const form = createFormControl<{ lyrics: Lyrics }>({
      resolver: valibotResolver(v.object({ lyrics: lyricsFormSchema })),
      defaultValues: { lyrics: [{ type: "verse", text: lines(9) }] },
    });
    const onValid = vi.fn();
    const onInvalid = vi.fn();

    await form.handleSubmit(onValid, onInvalid)();

    expect(onValid).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith(
      {
        lyrics: [{ text: { type: "check", message: "Ce passage ne peut pas dépasser 8 lignes" } }],
      },
      undefined,
    );

    form.setValue("lyrics.0.text", ` ${lines(8)} `);
    await form.handleSubmit(onValid, onInvalid)();
    expect(onValid).toHaveBeenCalledWith(
      { lyrics: [{ type: "verse", text: lines(8) }] },
      undefined,
    );
    expect(onInvalid).toHaveBeenCalledOnce();
  });
});

describe("song storage and form schemas", () => {
  it.each([
    [12, "12"],
    ["12", "12"],
    ["0012", "12"],
    [0, ""],
    [-1, ""],
    [1.5, ""],
    ["unknown", ""],
    [null, ""],
    [undefined, ""],
  ])("normalizes stored position %j to %j", (number, expected) => {
    expect(v.parse(songSchema, { title: "Song", number }).number).toBe(expected);
  });

  it("fills absent and null legacy fields", () => {
    expect(v.parse(songSchema, { title: "Song", lyrics: null, authors: null })).toEqual({
      title: "Song",
      aka: "",
      authors: "",
      number: "",
      copyright: "",
      translation: "",
      collection: "",
      previewUrl: "",
      lyrics: [],
    });
  });

  it.each(["", "12", "0012"])("accepts form position %j", (number) => {
    expect(v.parse(songFormSchema, { ...song, number }).number).toBe(number);
  });

  it.each(["-1", "1.5", "unknown", 12])("rejects form position %j", (number) => {
    expect(v.safeParse(songFormSchema, { ...song, number }).success).toBe(false);
  });

  it("trims a song title and rejects a blank title", () => {
    expect(v.parse(songFormSchema, { ...song, title: " Song " }).title).toBe("Song");
    expect(v.safeParse(songFormSchema, { ...song, title: " \t " }).success).toBe(false);
  });

  it.each(["", "https://example.com/preview"])("accepts preview URL %j", (previewUrl) => {
    expect(v.safeParse(songFormSchema, { ...song, previewUrl }).success).toBe(true);
  });

  it("rejects an invalid preview URL only in the form schema", () => {
    const data = { ...song, previewUrl: "not a URL" };
    expect(v.safeParse(songFormSchema, data).success).toBe(false);
    expect(v.parse(songSchema, data).previewUrl).toBe("not a URL");
  });
});

describe("recitation storage and form schemas", () => {
  it.each([8, 9])("validates a %i-line passage only in the form schema", (count) => {
    const data = { id: "recitation-1", title: "Reading", content: [{ text: lines(count) }] };
    expect(v.safeParse(recitationFormSchema, data).success).toBe(count <= 8);
    expect(v.parse(recitationSchema, data).content).toEqual(data.content);
  });

  it("rejects blank passages and trims valid text", () => {
    expect(
      v.safeParse(recitationFormSchema, { id: "", title: "", content: [{ text: " \n " }] }).success,
    ).toBe(false);
    expect(
      v.parse(recitationFormSchema, { id: "", title: "", content: [{ text: " Line " }] }).content,
    ).toEqual([{ text: "Line" }]);
  });
});

describe("liturgy storage and form schemas", () => {
  it("accepts the default liturgy in both schemas", () => {
    expect(v.parse(liturgySchema, defaultLiturgy)).toEqual(defaultLiturgy);
    expect(v.parse(liturgyFormSchema, defaultLiturgy)).toEqual(defaultLiturgy);
  });

  it("defaults missing legacy fields without allowing them in form submissions", () => {
    const data = {
      date: defaultLiturgy.date,
      version: liturgyDocumentVersion,
      blocks: [{ type: "songs", data: { items: [{ id: null, lyrics: null }] } }],
    };
    expect(v.parse(liturgySchema, data)).toEqual({
      uid: "",
      version: liturgyDocumentVersion,
      date: defaultLiturgy.date,
      blocks: [
        { type: "songs", data: { items: [{ id: "", lyrics: [], infos: "", repeat: false }] } },
      ],
    });
    expect(v.safeParse(liturgyFormSchema, data).success).toBe(false);
  });

  it("rejects a null song id in a form even when all other fields are present", () => {
    const data = {
      ...defaultLiturgy,
      blocks: [
        { type: "songs", data: { items: [{ id: null, lyrics: [], infos: "", repeat: false }] } },
      ],
    };
    expect(v.safeParse(liturgySchema, data).success).toBe(true);
    expect(v.safeParse(liturgyFormSchema, data).success).toBe(false);
  });

  it("validates overridden lyrics when submitting a liturgy", () => {
    const data = {
      ...defaultLiturgy,
      blocks: [
        {
          type: "songs",
          data: {
            items: [
              {
                id: "song-1",
                infos: "",
                repeat: false,
                lyrics: [{ type: "verse", text: lines(9) }],
              },
            ],
          },
        },
      ],
    };
    expect(v.safeParse(liturgySchema, data).success).toBe(true);
    const result = v.safeParse(liturgyFormSchema, data);
    expect(result.success).toBe(false);
    expect(result.issues && v.getDotPath(result.issues[0])).toBe(
      "blocks.0.data.items.0.lyrics.0.text",
    );
  });

  it.each([0, 1, maxPrayerTopics, maxPrayerTopics + 1])(
    "validates %i prayer topics only in the form schema",
    (count) => {
      const data = {
        ...defaultLiturgy,
        blocks: [
          {
            type: "openDoors",
            data: { title: "", detail: "", prayerTopics: Array(count).fill({ text: "" }) },
          },
        ],
      };
      expect(v.safeParse(liturgySchema, data).success).toBe(true);
      expect(v.safeParse(liturgyFormSchema, data).success).toBe(
        count >= 1 && count <= maxPrayerTopics,
      );
    },
  );
});
