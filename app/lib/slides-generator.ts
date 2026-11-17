import * as v from "valibot";

export const slidesGeneratorReleaseUrl =
  "https://github.com/EgliseLyonGerland/KeynoteSlidesGenerator/releases/latest";

const releaseSchema = v.object({
  assets: v.array(
    v.object({
      name: v.string(),
      browser_download_url: v.pipe(
        v.string(),
        v.url(),
        v.startsWith(
          "https://github.com/EgliseLyonGerland/KeynoteSlidesGenerator/releases/download/",
        ),
      ),
    }),
  ),
});

export async function getSlidesGeneratorDownloadUrl() {
  const response = await fetch(
    "https://api.github.com/repos/EgliseLyonGerland/KeynoteSlidesGenerator/releases/latest",
    {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Impossible de récupérer la dernière version (HTTP ${response.status}).`);
  }

  const release = v.parse(releaseSchema, await response.json());
  const asset = release.assets.find((asset) =>
    /^KeynoteSlidesGenerator(?:-[\d.]+)?\.zip$/i.test(asset.name),
  );

  if (!asset) {
    throw new Error("Aucune archive de l’application n’est disponible dans la dernière version.");
  }

  return asset.browser_download_url;
}
