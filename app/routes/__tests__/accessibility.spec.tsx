import { useLens } from "@hookform/lenses";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "@/components/ui/drawer";
import type { Recitation, Song } from "@/lib/schemas";

import { RecitationForm } from "../recitations.$recitationId";
import RecitationsCreate from "../recitations.create";
import { SongForm } from "../songs.$songId";
import SongsCreate from "../songs.create";

vi.mock("@/lib/api", () => ({}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  UNSAFE_withComponentProps: (Component: React.ComponentType) => Component,
  useBlocker: () => ({ state: "unblocked" }),
  useFetcher: () => ({ submit: vi.fn(), state: "idle" }),
}));

function InvalidSong() {
  const { control } = useForm<Song>({
    defaultValues: {
      title: "",
      aka: "",
      authors: "",
      number: 0,
      copyright: "",
      translation: "",
      collection: "",
      previewUrl: "",
      lyrics: [],
    },
    errors: { title: { type: "required", message: "Le titre est requis" } },
  });
  return <SongForm lens={useLens({ control })} />;
}

function InvalidRecitation() {
  const { control } = useForm<Recitation>({
    defaultValues: { title: "", content: [] },
    errors: { title: { type: "required", message: "Le titre est requis" } },
  });
  return <RecitationForm lens={useLens({ control })} />;
}

describe("Accessible editing forms", () => {
  it.each([
    ["chant", <SongsCreate key="song" />, "Nouveau chant", "Fermer le formulaire du chant"],
    [
      "récitation",
      <RecitationsCreate key="recitation" />,
      "Nouvelle récitation",
      "Fermer le formulaire de la récitation",
    ],
  ])(
    "provides a drawer title and close button name for a new %s",
    (_kind, form, title, closeLabel) => {
      const html = renderToStaticMarkup(<Drawer open>{form}</Drawer>);
      expect(html).toMatch(new RegExp(`<h2[^>]*>${title}</h2>`));
      expect(html).toContain(`aria-label="${closeLabel}"`);
    },
  );

  it.each([
    ["chant", <InvalidSong key="song" />],
    ["récitation", <InvalidRecitation key="recitation" />],
  ])("connects the %s title, label and validation message", (_kind, form) => {
    const html = renderToStaticMarkup(form);
    expect(html).toContain('for="title"');
    expect(html).toMatch(/<input[^>]*id="title"/);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="title-error"');
    expect(html).toContain('id="title-error"');
    expect(html).toContain("Le titre est requis");
  });
});
