import assert from "node:assert/strict";

import { describe, expect, it } from "vitest";

import { isEqualLyrics, prepareLyrics } from "../lyrics-utils";
import type { Lyrics } from "../schemas";

describe("isEqualLyrics()", () => {
  it("returns true for two empty lyrics arrays", () => {
    assert.equal(isEqualLyrics([], []), true);
  });

  describe("prepareLyrics()", () => {
    it("returns no passages for empty lyrics", () => {
      expect(prepareLyrics([])).toEqual([]);
    });

    it("preserves passage order and types while trimming and removing empty lines", () => {
      expect(
        prepareLyrics([
          { type: "verse", text: " First line \n\n Second line \n \n" },
          { type: "chorus", text: " Refrain " },
        ]),
      ).toEqual([
        { type: "verse", lines: ["First line", "Second line"] },
        { type: "chorus", lines: ["Refrain"] },
      ]);
    });

    it("keeps a short final word attached with a non-breaking space", () => {
      expect(prepareLyrics([{ type: "verse", text: "Gloire à\nDieu en\nDieu seul" }])).toEqual([
        { type: "verse", lines: ["Gloire\u00a0à", "Dieu\u00a0en", "Dieu seul"] },
      ]);
    });

    it("does not mutate the original lyrics", () => {
      const lyrics: Lyrics = [{ type: "verse", text: " Line \n\n" }];
      prepareLyrics(lyrics);
      expect(lyrics).toEqual([{ type: "verse", text: " Line \n\n" }]);
    });
  });

  it("returns true for identical lyrics", () => {
    const lyrics: Lyrics = [
      { type: "verse", text: "First line\nSecond line" },
      { type: "chorus", text: "Refrain" },
    ];

    assert.equal(isEqualLyrics(lyrics, [...lyrics]), true);
  });

  it("returns false when the arrays have different lengths", () => {
    assert.equal(isEqualLyrics([{ type: "verse", text: "Line" }], []), false);
  });

  it("returns false when a part type differs", () => {
    assert.equal(
      isEqualLyrics([{ type: "verse", text: "Line" }], [{ type: "chorus", text: "Line" }]),
      false,
    );
  });

  it("returns false when part text differs", () => {
    assert.equal(
      isEqualLyrics(
        [{ type: "verse", text: "First line" }],
        [{ type: "verse", text: "Different line" }],
      ),
      false,
    );
  });
});
