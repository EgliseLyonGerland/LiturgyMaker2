import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImagePreview } from "../image-preview";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useState: vi.fn(actual.useState) };
});

describe("ImagePreview", () => {
  beforeEach(() => {
    vi.mocked(useState).mockReturnValue([false, vi.fn()]);
  });

  it("does not render an image for an empty value", () => {
    expect(renderToStaticMarkup(<ImagePreview url="" />)).toBe("");
  });

  it.each(["not a URL", "/relative.jpg"])(
    "renders nothing for an invalid or relative URL: %s",
    (url) => {
      expect(renderToStaticMarkup(<ImagePreview url={url} />)).toBe("");
    },
  );

  it.each([
    "https://images.unsplash.com/photo-example?auto=format",
    "https://example.com/image-without-extension",
    "http://example.com/image.jpg",
    "https://unsplash.com/photos/example",
  ])("attempts to load HTTP image URLs without assuming a file extension: %s", (url) => {
    const html = renderToStaticMarkup(<ImagePreview url={url} />);
    expect(html).toContain(`src="${url}"`);
    expect(html).toContain('alt="Aperçu de l’image de la prédication"');
    expect(html).toContain('referrerPolicy="no-referrer"');
  });

  it.each([
    "https://example.com/image.jpg",
    "https://unsplash.com/photos/example",
    "https://example.com/article",
  ])("renders nothing after an image fails to load: %s", (url) => {
    vi.mocked(useState).mockReturnValue([true, vi.fn()]);

    expect(renderToStaticMarkup(<ImagePreview url={url} />)).toBe("");
  });
});
