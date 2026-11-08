import { useLens } from "@hookform/lenses";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "@/components/ui/drawer";
import type {
  RecitationForm as RecitationFormValues,
  SongForm as SongFormValues,
} from "@/lib/schemas";

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

function InvalidSong({ passageError }: { passageError?: string }) {
  const { control } = useForm<SongFormValues>({
    defaultValues: {
      title: "",
      aka: "",
      authors: "",
      number: "",
      copyright: "",
      translation: "",
      collection: "",
      previewUrl: "",
      lyrics: passageError ? [{ type: "verse", text: "" }] : [],
    },
    errors: {
      title: { type: "required", message: "Le titre est requis" },
      ...(passageError
        ? { lyrics: [{ text: { type: "validation", message: passageError } }] }
        : {}),
    },
  });
  return <SongForm lens={useLens({ control })} />;
}

function InvalidRecitation() {
  const { control } = useForm<RecitationFormValues>({
    defaultValues: { title: "", content: [] },
    errors: { title: { type: "required", message: "Le titre est requis" } },
  });
  return <RecitationForm lens={useLens({ control })} />;
}

describe("Accessible editing forms", () => {
  it.each(["Ce passage ne peut pas être vide", "Ce passage ne peut pas dépasser 8 lignes"])(
    "displays the lyrics validation error next to its passage: %s",
    (message) => {
      const html = renderToStaticMarkup(<InvalidSong passageError={message} />);
      expect(html).toMatch(
        /<textarea[^>]*aria-label="Texte du passage 1"[^>]*aria-invalid="true"[^>]*aria-describedby="passage\.[^"]+\.error"/,
      );
      expect(html).toMatch(/id="passage\.[^"]+\.error"/);
      expect(html).toContain(message);
    },
  );

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
