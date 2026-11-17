import { afterEach, describe, expect, it, vi } from "vitest";

import { getSlidesGeneratorDownloadUrl } from "../slides-generator";

const downloadUrl =
  "https://github.com/EgliseLyonGerland/KeynoteSlidesGenerator/releases/download/v14.5.0/KeynoteSlidesGenerator-14.5.0.zip";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockRelease(assets: unknown[]) {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ assets }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getSlidesGeneratorDownloadUrl", () => {
  it("retrieves the versioned application ZIP from the latest release", async () => {
    const fetchMock = mockRelease([
      { name: "source.zip", browser_download_url: downloadUrl },
      { name: "KeynoteSlidesGenerator-14.5.0.zip", browser_download_url: downloadUrl },
    ]);

    await expect(getSlidesGeneratorDownloadUrl()).resolves.toBe(downloadUrl);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/EgliseLyonGerland/KeynoteSlidesGenerator/releases/latest",
      {
        headers: { Accept: "application/vnd.github+json" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("also supports an unversioned application ZIP", async () => {
    mockRelease([{ name: "KeynoteSlidesGenerator.zip", browser_download_url: downloadUrl }]);
    await expect(getSlidesGeneratorDownloadUrl()).resolves.toBe(downloadUrl);
  });

  it.each([403, 404, 429, 500])("reports GitHub HTTP %s errors", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(getSlidesGeneratorDownloadUrl()).rejects.toThrow(`HTTP ${status}`);
  });

  it("reports network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(getSlidesGeneratorDownloadUrl()).rejects.toThrow("Failed to fetch");
  });

  it("rejects releases without the application archive", async () => {
    mockRelease([{ name: "source.zip", browser_download_url: downloadUrl }]);
    await expect(getSlidesGeneratorDownloadUrl()).rejects.toThrow("Aucune archive");
  });

  it("rejects malformed release data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ assets: null })));
    await expect(getSlidesGeneratorDownloadUrl()).rejects.toThrow();
  });

  it("rejects download links outside the expected repository", async () => {
    mockRelease([
      { name: "KeynoteSlidesGenerator.zip", browser_download_url: "https://example.com/app.zip" },
    ]);
    await expect(getSlidesGeneratorDownloadUrl()).rejects.toThrow();
  });
});
