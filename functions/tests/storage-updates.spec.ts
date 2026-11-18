import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  save: vi.fn(),
  get: vi.fn(),
  collectionGet: vi.fn(),
  file: vi.fn(),
  tasks: vi.fn(),
  created: vi.fn(),
  updated: vi.fn(),
  deleted: vi.fn(),
  enqueue: vi.fn(),
  deploy: vi.fn(),
}));
vi.mock("firebase-admin/storage", () => ({
  getStorage: () => ({ bucket: () => ({ file: mocks.file }) }),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({ get: mocks.get }),
      get: mocks.collectionGet,
    }),
  }),
}));
vi.mock("firebase-functions", () => ({ logger: { log: vi.fn(), info: vi.fn() } }));
vi.mock("firebase-functions/v2/tasks", () => ({ onTaskDispatched: mocks.tasks }));
vi.mock("firebase-functions/v2/firestore", () => ({
  onDocumentCreated: mocks.created,
  onDocumentUpdated: mocks.updated,
  onDocumentDeleted: mocks.deleted,
}));
vi.mock("../src/utils/enqueue-task", () => ({ default: mocks.enqueue }));
vi.mock("../src/utils/deploy-praise-explorer-app", () => ({ default: mocks.deploy }));

await import("../src/update-song");
await import("../src/update-liturgies");

const [upsertSong, deleteSong, upsertLiturgy, deleteLiturgy] = mocks.tasks.mock.calls.map(
  ([, handler]) => handler,
);
const songCreated = mocks.created.mock.calls[0][1];
const songUpdated = mocks.updated.mock.calls[0][1];
const songDeleted = mocks.deleted.mock.calls[0][1];
const liturgyCreated = mocks.created.mock.calls[1][1];
const liturgyUpdated = mocks.updated.mock.calls[1][1];
const liturgyDeleted = mocks.deleted.mock.calls[1][1];

beforeEach(() => {
  mocks.download.mockReset();
  mocks.save.mockReset();
  mocks.get.mockReset();
  mocks.collectionGet.mockReset();
  mocks.enqueue.mockReset();
  mocks.deploy.mockReset();
  mocks.file.mockReturnValue({ download: mocks.download, save: mocks.save });
  mocks.download.mockResolvedValue([Buffer.from("[]")]);
});

describe("Storage index updates", () => {
  it("adds a song including its Firestore fields", async () => {
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ title: "Test song" }) });
    await upsertSong({ data: { songId: "song-1" } });
    expect(mocks.file).toHaveBeenCalledWith("songs.json");
    expect(mocks.save).toHaveBeenCalledWith(
      JSON.stringify([{ title: "Test song", id: "song-1" }]),
      { contentType: "application/json" },
    );
  });

  it("updates an existing song without duplicating it or dropping other songs", async () => {
    mocks.download.mockResolvedValue([
      Buffer.from('[{"id":"other"},{"id":"song-1","title":"Old"}]'),
    ]);
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ title: "New" }) });
    await upsertSong({ data: { songId: "song-1" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([
      { id: "other" },
      { id: "song-1", title: "New" },
    ]);
  });

  it("deletes a song from Storage", async () => {
    mocks.download.mockResolvedValue([Buffer.from('[{"id":"song-1"},{"id":"other"}]')]);
    await deleteSong({ data: { songId: "song-1" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([{ id: "other" }]);
  });

  it("removes a song deleted before its update task runs", async () => {
    mocks.download.mockResolvedValue([Buffer.from('[{"id":"missing"},{"id":"other"}]')]);
    mocks.get.mockResolvedValue({ exists: false });
    await upsertSong({ data: { songId: "missing" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([{ id: "other" }]);
  });

  it("does not write an ID-only record for a missing song already absent from the index", async () => {
    mocks.get.mockResolvedValue({ exists: false });
    await upsertSong({ data: { songId: "missing" } });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("initializes songs from Firestore only on a Storage 404", async () => {
    mocks.download.mockRejectedValue(Object.assign(new Error("Missing"), { code: 404 }));
    mocks.collectionGet.mockResolvedValue({
      docs: [{ id: "song-1", data: () => ({ title: "Existing" }) }],
    });
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ title: "Updated" }) });
    await upsertSong({ data: { songId: "song-1" } });
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mocks.save.mock.calls[1][0])).toEqual([{ id: "song-1", title: "Updated" }]);
  });

  it.each([new Error("Permission denied"), new SyntaxError("Invalid JSON")])(
    "surfaces Storage/JSON errors rather than overwriting the files: %s",
    async (error) => {
      mocks.download.mockRejectedValue(error);
      await expect(upsertSong({ data: { songId: "song-1" } })).rejects.toThrow(error.message);
      await expect(upsertLiturgy({ data: { liturgyId: "liturgy-1" } })).rejects.toThrow(
        error.message,
      );
      expect(mocks.save).not.toHaveBeenCalled();
    },
  );

  it("upserts a liturgy and sorts the file by date descending", async () => {
    mocks.download.mockResolvedValue([Buffer.from('[{"id":"older","date":1,"songs":["other"]}]')]);
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => ({
        date: 2,
        blocks: [{ type: "songs", data: { items: [{ id: "song-1" }, {}] } }],
      }),
    });
    await upsertLiturgy({ data: { liturgyId: "liturgy-1" } });
    expect(mocks.file).toHaveBeenCalledWith("liturgies.json");
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([
      { id: "liturgy-1", date: 2, songs: ["song-1"] },
      { id: "older", date: 1, songs: ["other"] },
    ]);
  });

  it("removes a liturgy whose last song was removed", async () => {
    mocks.download.mockResolvedValue([
      Buffer.from('[{"id":"liturgy-1","date":1,"songs":["song"]}]'),
    ]);
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ date: 1, blocks: [] }) });
    await upsertLiturgy({ data: { liturgyId: "liturgy-1" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([]);
  });

  it("deletes a liturgy from Storage", async () => {
    mocks.download.mockResolvedValue([
      Buffer.from('[{"id":"liturgy-1","date":1,"songs":["song"]}]'),
    ]);
    await deleteLiturgy({ data: { liturgyId: "liturgy-1" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([]);
  });

  it("removes a liturgy deleted before its update task runs", async () => {
    mocks.download.mockResolvedValue([Buffer.from('[{"id":"missing","date":1,"songs":["song"]}]')]);
    mocks.get.mockResolvedValue({ exists: false });
    await upsertLiturgy({ data: { liturgyId: "missing" } });
    expect(JSON.parse(mocks.save.mock.calls[0][0])).toEqual([]);
  });

  it("does not rewrite an index for a missing liturgy already absent from the index", async () => {
    mocks.get.mockResolvedValue({ exists: false });
    await upsertLiturgy({ data: { liturgyId: "missing" } });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    [songCreated, "updateSongTask", { songId: "song-1" }],
    [songUpdated, "updateSongTask", { songId: "song-1" }],
    [songDeleted, "deleteSongTask", { songId: "song-1" }],
    [liturgyCreated, "upsertLiturgiesTask", { liturgyId: "liturgy-1" }],
    [liturgyUpdated, "upsertLiturgiesTask", { liturgyId: "liturgy-1" }],
    [liturgyDeleted, "deleteLiturgiesTask", { liturgyId: "liturgy-1" }],
  ])("wires Firestore events to their task: %s", async (handler, name, params) => {
    await handler({ params });
    expect(mocks.enqueue).toHaveBeenCalledWith(name, params);
  });
});
