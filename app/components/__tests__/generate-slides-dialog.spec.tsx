import { liturgyDocumentVersion, type Liturgy } from "@liturgy-maker/shared";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { generateCode } from "@/lib/code";
import { createDefaultSectionBlock } from "@/lib/default-liturgy";

import { GenerateSlidesDialog } from "../liturgy/generate-slides-dialog";

vi.mock("@/components/ui/dialog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/ui/dialog")>()),
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

vi.mock("../liturgy/code-dialog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../liturgy/code-dialog")>()),
  CodeDialog: () => null,
}));

const date = new Date(2026, 10, 22, 10);
const liturgy: Liturgy = {
  uid: "",
  date: +date,
  version: liturgyDocumentVersion,
  blocks: [createDefaultSectionBlock({ title: "Accueil & prière : « Bienvenue »" })],
};

function TestDialog() {
  const form = useForm<Liturgy>({ defaultValues: liturgy });

  return (
    <FormProvider {...form}>
      <GenerateSlidesDialog date={date} songs={[]} recitations={[]} />
    </FormProvider>
  );
}

describe("GenerateSlidesDialog", () => {
  it("offers a dated JSON download using the existing slide generator format", () => {
    const html = renderToStaticMarkup(<TestDialog />);
    const href = html.match(/href="(data:application\/json;charset=utf-8,[^"]+)"/)?.[1];

    expect(href).toBeDefined();
    const code = decodeURIComponent(href!.split(",")[1]);
    expect(code).toBe(generateCode({ date, liturgy, songs: [], recitations: [] }));
    expect(JSON.parse(code)).toEqual({ date: date.toISOString(), slides: liturgy.blocks });
    expect(html).toContain('download="liturgie-2026-11-22.json"');
  });

  it("guides the user through the downloads, Mac permissions and generation in order", () => {
    const html = renderToStaticMarkup(<TestDialog />);

    expect(html).toMatch(/<button[^>]*type="button"[^>]*>.*?Télécharger l’application<\/button>/);
    expect(html).toContain(
      'href="https://drive.google.com/file/d/1GprojDkA9y_sVaS8arQztDFEkOwe-CcR/view"',
    );
    expect(html.match(/target="_blank" rel="noopener noreferrer"/g)).toHaveLength(1);
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html.indexOf("Télécharger le modèle Keynote")).toBeLessThan(
      html.indexOf("Lancer l’application"),
    );
    expect(html.indexOf("Télécharger le fichier .json")).toBeLessThan(
      html.indexOf("Lancer l’application"),
    );
    for (const instruction of [
      "clic droit sur l’application",
      "contrôler Keynote",
      "Autoriser",
      "téléchargé à l’étape 1",
      "les slides se créer",
      "télécharger directement la dernière version",
    ]) {
      expect(html).toContain(instruction);
    }
  });

  it("offers a button to open the code preview", () => {
    const html = renderToStaticMarkup(<TestDialog />);

    expect(html).toMatch(/<button[^>]*aria-haspopup="dialog"[^>]*>Afficher le code<\/button>/);
  });
});
