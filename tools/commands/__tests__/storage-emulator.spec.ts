import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  prompt: vi.fn(),
  request: vi.fn(),
  getClient: vi.fn(),
  auth: vi.fn(),
  fetch: vi.fn(),
  export: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("inquirer", () => ({ default: { prompt: mocks.prompt } }));
vi.mock("../emulator.ts", () => ({ exportEmulators: mocks.export }));
vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    constructor(options: unknown) {
      mocks.auth(options);
    }
    getClient = mocks.getClient;
  },
}));

import { handler } from "../storage-emulator.ts";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.readFile.mockResolvedValue('{"emulators":{}}');
  mocks.fetch.mockResolvedValue({ ok: true });
  mocks.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ storage: { host: "127.0.0.1", port: 9199 } }),
  });
  mocks.prompt.mockResolvedValue({ ok: true });
  mocks.getClient.mockResolvedValue({ request: mocks.request });
  mocks.request.mockResolvedValue({ data: '[{"id":"from-production"}]' });
});

describe("sync storage-emulator", () => {
  it("only reads production, uploads all three JSON files locally and exports", async () => {
    await handler({ yes: true, credentials: "/tmp/test-key.json" });
    expect(mocks.auth).toHaveBeenCalledWith({
      scopes: ["https://www.googleapis.com/auth/devstorage.read_only"],
      keyFilename: "/tmp/test-key.json",
    });
    expect(mocks.request.mock.calls.map(([options]) => options.url)).toEqual([
      "https://storage.googleapis.com/storage/v1/b/liturgymaker.appspot.com/o/songs.json?alt=media",
      "https://storage.googleapis.com/storage/v1/b/liturgymaker.appspot.com/o/liturgies.json?alt=media",
      "https://storage.googleapis.com/storage/v1/b/liturgymaker.appspot.com/o/latestLiturgies.json?alt=media",
    ]);
    for (const [options] of mocks.request.mock.calls) {
      expect(options.method).toBeUndefined();
    }
    for (const name of ["songs.json", "liturgies.json", "latestLiturgies.json"]) {
      expect(mocks.fetch).toHaveBeenCalledWith(
        `http://127.0.0.1:9199/v0/b/liturgymaker.appspot.com/o?name=${name}`,
        expect.objectContaining({ method: "POST", body: '[{"id":"from-production"}]' }),
      );
    }
    expect(mocks.export).toHaveBeenCalledWith("liturgymaker");
  });

  it("does not authenticate, upload or export if confirmation is declined", async () => {
    mocks.prompt.mockResolvedValue({ ok: false });
    await handler({ yes: false });
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.export).not.toHaveBeenCalled();
  });

  it("validates all three source files before the first local upload", async () => {
    mocks.request
      .mockResolvedValueOnce({ data: "[]" })
      .mockResolvedValueOnce({ data: "[]" })
      .mockResolvedValueOnce({ data: "{}" });
    await expect(handler({ yes: true })).rejects.toThrow("expected a JSON array");
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.export).not.toHaveBeenCalled();
  });

  it("reports production read failures without mutating local data", async () => {
    mocks.request.mockRejectedValue(new Error("Permission denied"));
    await expect(handler({ yes: true })).rejects.toThrow("Permission denied");
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.export).not.toHaveBeenCalled();
  });

  it("rejects a non-local Storage target", async () => {
    mocks.fetch.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ storage: { host: "production.invalid", port: 443 } }),
    });
    await expect(handler({ yes: true })).rejects.toThrow("Local Storage emulator is not running");
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("does not claim success or export after a failed upload", async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(handler({ yes: true })).rejects.toThrow("Local Storage upload failed");
    expect(mocks.export).not.toHaveBeenCalled();
  });
});
