import { getBytes, ref } from "firebase/storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSongsStats } from "../api";

const storage = vi.hoisted(() => ({}));

vi.mock("../firebase", () => ({ firebaseDb: {}, firebaseStorage: storage }));
vi.mock("firebase/storage", () => ({
  ref: vi.fn((_storage, path) => ({ path })),
  getBytes: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSongsStats", () => {
  it("reads and validates the liturgies index", async () => {
    const index = [{ id: "20261101", date: 123, songs: ["song-1", "song-2"] }];
    vi.mocked(getBytes).mockResolvedValueOnce(
      new TextEncoder().encode(JSON.stringify(index)).buffer,
    );

    expect(await getSongsStats()).toEqual(index);
    expect(ref).toHaveBeenCalledWith(storage, "liturgies.json");
    expect(getBytes).toHaveBeenCalledWith({ path: "liturgies.json" });
  });

  it("propagates Storage errors", async () => {
    const error = new Error("Permission denied");
    vi.mocked(getBytes).mockRejectedValueOnce(error);

    await expect(getSongsStats()).rejects.toBe(error);
  });

  it.each(["not json", '[{"id":"a","date":"invalid","songs":[]}]'])(
    "rejects invalid index data",
    async (data) => {
      vi.mocked(getBytes).mockResolvedValueOnce(new TextEncoder().encode(data).buffer);

      await expect(getSongsStats()).rejects.toThrow();
    },
  );
});
