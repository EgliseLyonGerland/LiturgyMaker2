import type { Lyrics } from "@liturgy-maker/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LyricsDiff } from "../lyrics-diff";

const verse = (text: string): Lyrics => [{ type: "verse", text }];

function render(original: Lyrics, modified: Lyrics) {
  return renderToStaticMarkup(<LyricsDiff original={original} modified={modified} />);
}

describe("LyricsDiff", () => {
  it("shows all unchanged lines around a modification and highlights changed words", () => {
    const html = render(
      verse("Avant\nUne ancienne parole\nAprès"),
      verse("Avant\nUne nouvelle parole\nAprès"),
    );

    expect(html).toContain("Avant");
    expect(html).toContain("Après");
    expect(html).toMatch(/<mark[^>]*>ancienne<\/mark>/);
    expect(html).toMatch(/<mark[^>]*>nouvelle<\/mark>/);
    expect(html).toContain("Ligne supprimée");
    expect(html).toContain("Ligne ajoutée");
    expect(html.indexOf("Avant")).toBeLessThan(html.indexOf("ancienne"));
    expect(html.indexOf("nouvelle")).toBeLessThan(html.indexOf("Après"));
  });

  it("preserves repeated refrains and the separation between verses", () => {
    const original: Lyrics = [
      { type: "verse", text: "Premier couplet" },
      { type: "chorus", text: "Refrain\nAlléluia" },
      { type: "verse", text: "Autre couplet" },
      { type: "chorus", text: "Refrain\nAlléluia" },
    ];
    const modified: Lyrics = [
      ...original.slice(0, 2),
      { type: "verse", text: "Nouveau couplet" },
      original[3],
    ];
    const html = render(original, modified);

    expect(html.match(/>Refrain<\/div>/g)).toHaveLength(2);
    expect(html.match(/>Alléluia<\/div>/g)).toHaveLength(2);
    expect(html.match(/min-h-lh[^"]*"><\/div>/g)).toHaveLength(3);
    expect(html).toContain("pl-14");
    expect(html).toMatch(/<mark[^>]*>Autre<\/mark>/);
    expect(html).toMatch(/<mark[^>]*>Nouveau<\/mark>/);
  });

  it("shows standalone added and removed lines without inventing word changes", () => {
    const added = render(verse("Première"), verse("Première\nDeuxième"));
    const removed = render(verse("Première\nDeuxième"), verse("Première"));

    expect(added).toContain("Ligne ajoutée");
    expect(removed).toContain("Ligne supprimée");
    expect(added).not.toContain("<mark");
    expect(removed).not.toContain("<mark");
  });

  it("matches changed lines even when a new line is inserted before them", () => {
    const html = render(
      verse("La lumière ancienne"),
      verse("Une ligne ajoutée\nLa lumière nouvelle"),
    );

    expect(html).toContain("Une ligne ajoutée");
    expect(html).toMatch(/<mark[^>]*>ancienne<\/mark>/);
    expect(html).toMatch(/<mark[^>]*>nouvelle<\/mark>/);
    expect(html).not.toMatch(/<mark[^>]*>Une ligne ajoutée<\/mark>/);
  });

  it("highlights a completely replaced single line", () => {
    const html = render(verse("Ancien"), verse("Nouveau"));
    expect(html).toMatch(/<mark[^>]*>Ancien<\/mark>/);
    expect(html).toMatch(/<mark[^>]*>Nouveau<\/mark>/);
  });

  it("handles identical, empty and multiple changed lines", () => {
    const identical = render(verse("Identique"), verse("Identique"));
    expect(identical).toContain("Identique");
    expect(identical).not.toContain("Ligne ajoutée");
    expect(identical).not.toContain("Ligne supprimée");
    expect(render([], [])).toBe("<div></div>");

    const html = render(verse("Ancien un\nAncien deux"), verse("Nouveau un\nNouveau deux"));
    expect(html.match(/Ligne supprimée/g)).toHaveLength(2);
    expect(html.match(/Ligne ajoutée/g)).toHaveLength(2);
    expect(html.match(/<mark/g)).toHaveLength(4);
  });
});
