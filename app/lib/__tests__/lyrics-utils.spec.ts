import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isEqualLyrics } from "../lyrics-utils";
import type { Lyrics } from "../schemas";

describe("isEqualLyrics()", () => {
  it("returns true for two empty lyrics arrays", () => {
    assert.equal(isEqualLyrics([], []), true);
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
