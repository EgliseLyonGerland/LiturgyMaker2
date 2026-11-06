import { useLens } from "@hookform/lenses";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { liturgyDocumentVersion } from "@/config";
import {
  createDefaultAnnouncementsBlock,
  createDefaultOpenDoorsBlock,
  createDefaultReadingBlock,
  createDefaultRecitationBlock,
  createDefaultSermonBlock,
  createDefaultSongsBlock,
} from "@/lib/default-liturgy";
import { liturgyBlockContext } from "@/lib/liturgy-context";
import type { Liturgy, Lyrics, RecitationContent } from "@/lib/schemas";

import { AnnouncementsBlockForm } from "../liturgy/block-forms/announcements";
import { OpenDoorsBlockForm } from "../liturgy/block-forms/open-doors";
import { ReadingBlockForm } from "../liturgy/block-forms/reading";
import { RecitationBlockForm } from "../liturgy/block-forms/recitation";
import { SermonBlockForm } from "../liturgy/block-forms/sermon";
import { SongsBlockForm } from "../liturgy/block-forms/songs";
import { LiturgyHeader } from "../liturgy/header";
import { LiturgyMenu } from "../liturgy/liturgy-menu";
import { PassageFieldArray } from "../lyrics-field-array";
import Preview from "../preview";
import { ThemeProvider, ThemeSwitcher } from "../theme";
import { CodeBlockCopyButton } from "../ui/code-block";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => vi.fn(),
}));

function BlockForm({
  block,
  errors,
  children,
}: {
  block: Liturgy["blocks"][number];
  errors?: FieldErrors<Liturgy>;
  children: ReactNode;
}) {
  const form = useForm<Liturgy>({
    defaultValues: { uid: "", version: liturgyDocumentVersion, blocks: [block] },
    errors,
  });

  return (
    <FormProvider {...form}>
      <liturgyBlockContext.Provider value={{ remove: vi.fn(), fillFromPreviousWeek: vi.fn() }}>
        {children}
      </liturgyBlockContext.Provider>
    </FormProvider>
  );
}

function Passages({ kind, invalid = false }: { kind: "song" | "recitation"; invalid?: boolean }) {
  const form = useForm<{ lyrics: Lyrics; content: RecitationContent }>({
    defaultValues: {
      lyrics: [
        { type: "verse", text: "" },
        { type: "chorus", text: "" },
      ],
      content: [{ text: "" }, { text: "" }],
    },
    errors: invalid
      ? { lyrics: [{ text: { type: "required", message: "Ce passage ne peut pas être vide" } }] }
      : undefined,
  });
  const lens = useLens({ control: form.control });

  return kind === "song" ? (
    <PassageFieldArray kind="song" lens={lens.focus("lyrics")} />
  ) : (
    <PassageFieldArray kind="recitation" lens={lens.focus("content")} />
  );
}

describe("Accessible names and relationships", () => {
  it.each(["song", "recitation"] as const)("names each %s passage and its actions", (kind) => {
    const html = renderToStaticMarkup(<Passages kind={kind} />);

    for (const index of [1, 2]) {
      expect(html).toContain(`aria-label="Texte du passage ${index}"`);
      expect(html).toMatch(new RegExp(`<button[^>]*aria-label="Déplacer le passage ${index}"`));
      expect(html).toContain(`aria-label="Actions du passage ${index}"`);
    }
    if (kind === "song") {
      expect(html).toContain('aria-label="Refrain pour le passage 1"');
      expect(html).toContain('aria-label="Refrain pour le passage 2"');
    }
  });

  it("associates a passage error with its textarea", () => {
    const html = renderToStaticMarkup(<Passages kind="song" invalid />);
    const errorId = html.match(/<textarea[^>]*aria-describedby="([^"]+)"/)?.[1];

    expect(errorId).toBeDefined();
    expect(html).toContain(`id="${errorId}"`);
    expect(html).toContain("Ce passage ne peut pas être vide");
  });

  it("connects the reading label and validation error to the autocomplete", () => {
    const html = renderToStaticMarkup(
      <BlockForm
        block={createDefaultReadingBlock()}
        errors={{
          blocks: [
            { data: { bibleRefs: [{ id: { type: "validate", message: "Référence invalide" } }] } },
          ],
        }}
      >
        <ReadingBlockForm id="reading" index={0} />
      </BlockForm>,
    );

    expect(html).toContain('for="blocks.0.data.bibleRefs.0.id"');
    expect(html).toMatch(/<input[^>]*id="blocks\.0\.data\.bibleRefs\.0\.id"/);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="blocks.0.data.bibleRefs.0.id-error"');
    expect(html).toContain('id="blocks.0.data.bibleRefs.0.id-error"');
  });

  it("names sermon references and points, including their reorder and delete actions", () => {
    const html = renderToStaticMarkup(
      <BlockForm block={createDefaultSermonBlock()}>
        <SermonBlockForm id="sermon" index={0} />
      </BlockForm>,
    );

    for (const name of [
      "Référence biblique 1",
      "Déplacer la référence 1",
      "Supprimer la référence 1",
      "Point 1 de la prédication",
      "Déplacer le point 1",
      "Supprimer le point 1",
    ]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
  });

  it("names prayer topics and their actions", () => {
    const html = renderToStaticMarkup(
      <BlockForm block={createDefaultOpenDoorsBlock()}>
        <OpenDoorsBlockForm id="prayers" index={0} />
      </BlockForm>,
    );

    for (const name of [
      "Sujet de prière 1",
      "Déplacer le sujet de prière 1",
      "Supprimer le sujet de prière 1",
    ]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
  });

  it.each([
    [
      "song",
      createDefaultSongsBlock(),
      <SongsBlockForm key="songs" id="songs" index={0} songs={[]} />,
      "blocks.0.data.items.0.id",
    ],
    [
      "recitation",
      createDefaultRecitationBlock(),
      <RecitationBlockForm key="recitation" id="recitation" index={0} recitations={[]} />,
      "blocks.0.data.id",
    ],
  ] as const)("connects the %s selector to its visible label", (_kind, block, children, id) => {
    const html = renderToStaticMarkup(<BlockForm block={block}>{children}</BlockForm>);

    expect(html).toContain(`for="${id}"`);
    expect(html).toMatch(new RegExp(`<button[^>]*id="${id.replaceAll(".", "\\.")}"`));
  });

  it("names announcement actions by position", () => {
    const block = createDefaultAnnouncementsBlock();
    block.data.items.push({ title: "", detail: "" });
    const html = renderToStaticMarkup(
      <BlockForm block={block}>
        <AnnouncementsBlockForm id="announcements" index={0} />
      </BlockForm>,
    );

    for (const index of [1, 2]) {
      expect(html).toContain(`aria-label="Déplacer l&#x27;annonce ${index}"`);
      expect(html).toContain(`aria-label="Supprimer l&#x27;annonce ${index}"`);
    }
  });

  it("keeps save and menu actions named when their visible text is hidden on mobile", () => {
    const html = renderToStaticMarkup(<LiturgyHeader date={new Date(2026, 10, 1)} />);

    expect(html).toContain('aria-label="Enregistrer la liturgie"');
    expect(html).toContain('aria-label="Actions de la liturgie"');
    expect(html).toMatch(/aria-label="Aller à la liturgie du [^"]+"/);
  });

  it("keeps navigation links and reorder buttons separate and keyboard reachable", () => {
    const block = createDefaultSermonBlock();
    const html = renderToStaticMarkup(
      <BlockForm block={block}>
        <LiturgyMenu
          fields={[{ ...block, id: "sermon" }]}
          songs={[]}
          recitations={[]}
          onClick={vi.fn()}
          onMove={vi.fn()}
        />
      </BlockForm>,
    );

    expect(html).toContain('aria-label="Plan de la liturgie"');
    expect(html).toContain('href="#sermon"');
    expect(html).toContain('aria-label="Déplacer le bloc 1 : Prédication"');
    for (const [link] of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)) {
      expect(link).not.toContain("<button");
    }
    expect(html).not.toContain("invisible");
  });

  it("names shared icon buttons in French", () => {
    const html = renderToStaticMarkup(
      <>
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
        <CodeBlockCopyButton value="{}" />
        <SidebarProvider>
          <SidebarTrigger />
        </SidebarProvider>
      </>,
    );

    expect(html).toContain('aria-label="Choisir le thème"');
    expect(html).toContain('aria-label="Copier le code"');
    expect(html).toContain("Afficher ou masquer la navigation");
    expect(html).toContain('aria-expanded="true"');
  });

  it.each([
    ["Mon chant", "Aperçu du chant Mon chant"],
    ["", "Aperçu du chant"],
  ])("gives the embedded preview a meaningful title (%s)", (title, accessibleTitle) => {
    const html = renderToStaticMarkup(
      <Preview title={title} url="https://drive.google.com/file/d/example/view" />,
    );
    expect(html.match(/<iframe[^>]*title="([^"]*)"/)?.[1].trim()).toBe(accessibleTitle);
  });
});
