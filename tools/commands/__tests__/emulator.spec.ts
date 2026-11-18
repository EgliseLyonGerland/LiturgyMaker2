import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  spawn: vi.fn(),
  prompt: vi.fn(),
  initializeApp: vi.fn(),
  deleteApp: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  recursiveDelete: vi.fn(),
  batch: vi.fn(),
  set: vi.fn(),
  commit: vi.fn(),
  fetch: vi.fn(),
  fixEmulatorUser: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("node:child_process", () => ({ spawn: mocks.spawn }));
vi.mock("inquirer", () => ({ default: { prompt: mocks.prompt } }));
vi.mock("firebase-admin/app", () => ({
  initializeApp: mocks.initializeApp,
  deleteApp: mocks.deleteApp,
}));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: mocks.getFirestore }));
vi.mock("../../utils/emulator-auth.ts", () => ({ fixEmulatorUser: mocks.fixEmulatorUser }));

import { handler } from "../emulator.ts";

const names = ["users", "liturgies", "songs", "recitations"];
let files: Record<string, unknown>;

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.stubGlobal("fetch", mocks.fetch);
  vi.spyOn(console, "log").mockImplementation(() => {});
  files = {
    "firebase.json": { emulators: { firestore: { port: 8080 } } },
    ".firebaserc": { projects: { default: "demo-backup-test" } },
    ...Object.fromEntries(
      names.map((name) => [`.firebase/backup/${name}.json`, [{ id: `${name}-1`, title: name }]]),
    ),
  };
  mocks.readFile.mockImplementation(async (filename: string) => {
    const key = Object.keys(files).find((key) => filename.endsWith(`/${key}`));
    if (!key) throw new Error("Missing file");
    return JSON.stringify(files[key]);
  });
  mocks.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      firestore: { host: "127.0.0.1", port: 8080 },
      auth: { host: "127.0.0.1", port: 9099 },
    }),
  });
  mocks.prompt.mockResolvedValue({ ok: true });
  mocks.collection.mockImplementation((name: string) => ({
    path: name,
    doc: (id: string) => ({ path: `${name}/${id}` }),
  }));
  mocks.batch.mockReturnValue({ set: mocks.set, commit: mocks.commit });
  mocks.initializeApp.mockReturnValue({ name: "backup-emulator" });
  mocks.getFirestore.mockReturnValue({
    collection: mocks.collection,
    recursiveDelete: mocks.recursiveDelete,
    batch: mocks.batch,
  });
  mocks.spawn.mockImplementation(() => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit("exit", 0, null));
    return child;
  });
});

describe("sync emulator", () => {
  it("replaces only the four backup collections, then exports all emulator data", async () => {
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "production.invalid:443");
    mocks.initializeApp.mockImplementation((options, name) => {
      expect(process.env.FIRESTORE_EMULATOR_HOST).toBe("127.0.0.1:8080");
      expect(options).toEqual({ projectId: "demo-backup-test" });
      expect(name).toBe("backup-emulator");
      return { name: "backup-emulator" };
    });

    await handler({ yes: true });

    expect(mocks.prompt).not.toHaveBeenCalled();
    expect(mocks.fixEmulatorUser).toHaveBeenCalledWith("127.0.0.1:9099", "demo-backup-test");
    expect(mocks.recursiveDelete.mock.calls.map(([collection]) => collection.path)).toEqual(names);
    for (const name of names) {
      expect(mocks.set).toHaveBeenCalledWith({ path: `${name}/${name}-1` }, { title: name });
    }
    expect(mocks.commit).toHaveBeenCalledTimes(4);
    expect(mocks.spawn).toHaveBeenCalledOnce();
    const [executable, args, options] = mocks.spawn.mock.calls[0];
    expect(executable).toBe(process.execPath);
    expect(args).toEqual([
      expect.stringContaining("firebase-tools/lib/bin/firebase.js"),
      "emulators:export",
      expect.stringContaining("/.firebase/export"),
      "--project",
      "demo-backup-test",
      "--config",
      expect.stringContaining("/firebase.json"),
      "--force",
    ]);
    expect(options.stdio).toBe("inherit");
    expect(mocks.spawn.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.commit.mock.invocationCallOrder.at(-1)!,
    );
    expect(mocks.deleteApp).toHaveBeenCalledOnce();
    expect(mocks.getFirestore).toHaveBeenCalledWith({ name: "backup-emulator" });
    expect(mocks.deleteApp).toHaveBeenCalledWith({ name: "backup-emulator" });
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe("production.invalid:443");
  });

  it("writes more than 500 documents using batches of at most 400 writes", async () => {
    for (const name of names) files[`.firebase/backup/${name}.json`] = [];
    files[".firebase/backup/songs.json"] = Array.from({ length: 801 }, (_, i) => ({
      id: `song-${i}`,
      title: `Song ${i}`,
    }));
    const sizes: number[] = [];
    let size = 0;
    mocks.set.mockImplementation(() => size++);
    mocks.commit.mockImplementation(async () => {
      sizes.push(size);
      size = 0;
    });

    await handler({ yes: true });

    expect(sizes).toEqual([400, 400, 1]);
    expect(mocks.recursiveDelete).toHaveBeenCalledTimes(4);
    expect(mocks.set).toHaveBeenCalledTimes(801);
  });

  it.each([
    null,
    {},
    [null],
    [{ title: "Missing ID" }],
    [{ id: "" }],
    [{ id: "invalid/id" }],
    [{ id: ".." }],
    [{ id: "__reserved__" }],
    [{ id: "a".repeat(1501) }],
    [{ id: "duplicate" }, { id: "duplicate" }],
  ])("rejects invalid backups before any deletion: %j", async (backup) => {
    files[".firebase/backup/recitations.json"] = backup;

    await expect(handler({ yes: true })).rejects.toThrow("recitations.json");

    expect(mocks.initializeApp).not.toHaveBeenCalled();
    expect(mocks.recursiveDelete).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("does not mutate data when a backup file is missing", async () => {
    delete files[".firebase/backup/songs.json"];
    await expect(handler({ yes: true })).rejects.toThrow("Missing file");
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("aborts without writing or exporting when confirmation is declined", async () => {
    mocks.prompt.mockResolvedValue({ ok: false });

    await handler({ yes: false });

    expect(mocks.prompt).toHaveBeenCalledWith([expect.objectContaining({ default: false })]);
    expect(mocks.initializeApp).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(mocks.fixEmulatorUser).not.toHaveBeenCalled();
  });

  it("rejects a non-local emulator configuration", async () => {
    files["firebase.json"] = { emulators: { firestore: { host: "production.invalid" } } };
    await expect(handler({ yes: true })).rejects.toThrow("Invalid local firestore");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("rejects an unavailable emulator before deleting data", async () => {
    mocks.fetch.mockRejectedValue(new Error("Connection refused"));
    await expect(handler({ yes: true })).rejects.toThrow("Connection refused");
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("rejects a running emulator whose address differs from the configuration", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ firestore: { host: "127.0.0.1", port: 8081 } }),
    });
    await expect(handler({ yes: true })).rejects.toThrow("does not match");
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("surfaces export failures and still cleans up the app", async () => {
    mocks.spawn.mockImplementation(() => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("exit", 1, null));
      return child;
    });

    await expect(handler({ yes: true })).rejects.toThrow("Local data was updated but not saved");
    expect(mocks.deleteApp).toHaveBeenCalledOnce();
  });

  it("does not replace Firestore data if the local Auth correction fails", async () => {
    mocks.fixEmulatorUser.mockRejectedValue(new Error("UID collision"));
    await expect(handler({ yes: true })).rejects.toThrow("UID collision");
    expect(mocks.initializeApp).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("does not export partial data after a write failure", async () => {
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", undefined);
    mocks.commit.mockRejectedValue(new Error("Write failed"));
    await expect(handler({ yes: true })).rejects.toThrow("Write failed");
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(mocks.deleteApp).toHaveBeenCalledOnce();
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeUndefined();
  });

  it.each([false, true])(
    "disables and restores background triggers, including on failure (%j)",
    async (fail) => {
      mocks.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            firestore: { host: "127.0.0.1", port: 8080 },
            auth: { host: "127.0.0.1", port: 9099 },
            functions: { host: "127.0.0.1", port: 5001 },
          }),
        })
        .mockResolvedValue({ ok: true });
      if (fail) {
        mocks.commit.mockRejectedValue(new Error("Write failed"));
        await expect(handler({ yes: true })).rejects.toThrow("Write failed");
      } else {
        await handler({ yes: true });
      }
      expect(mocks.fetch).toHaveBeenNthCalledWith(
        2,
        "http://127.0.0.1:4400/functions/disableBackgroundTriggers",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(mocks.fetch).toHaveBeenNthCalledWith(
        3,
        "http://127.0.0.1:4400/functions/enableBackgroundTriggers",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(mocks.fetch.mock.invocationCallOrder[1]).toBeLessThan(
        mocks.fixEmulatorUser.mock.invocationCallOrder[0],
      );
      expect(mocks.fetch.mock.invocationCallOrder[2]).toBeGreaterThan(
        mocks.deleteApp.mock.invocationCallOrder[0],
      );
    },
  );
});
