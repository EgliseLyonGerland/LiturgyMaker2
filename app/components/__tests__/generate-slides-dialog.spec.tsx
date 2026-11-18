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

    expect(html).toContain("Télécharger l’application");
    expect(html).toContain(
      'href="https://drive.google.com/file/d/1GprojDkA9y_sVaS8arQztDFEkOwe-CcR/view"',
    );
    expect(html.match(/target="_blank" rel="noopener noreferrer"/g)).toHaveLength(1);
    expect(html.match(/data-slot="accordion-item"/g)).toHaveLength(4);
    for (const step of [
      "Télécharger le fichier .json",
      "Télécharger le modèle Keynote",
      "Télécharger l’application",
      "Générer les slides",
    ]) {
      expect(html).toContain(step);
    }
    const finalStepPosition = html.lastIndexOf("Générer les slides");
    expect(html.lastIndexOf("Télécharger le modèle Keynote")).toBeLessThan(finalStepPosition);
    expect(html.lastIndexOf("Télécharger le fichier .json")).toBeLessThan(finalStepPosition);
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

    expect(html).toMatch(
      /<button[^>]*aria-haspopup="dialog"[^>]*>.*?<span class="sr-only">Afficher le code<\/span><\/button>/,
    );
  });

  it("shows both macOS security methods in order, with the settings method as an alternative", () => {
    const html = renderToStaticMarkup(<TestDialog />);

    const rightClickInstruction = html.indexOf("clic droit sur l’application");
    const settingsInstruction = html.indexOf("Si cette méthode ne fonctionne pas");

    expect(html).toContain("Confirmez en cliquant à nouveau sur");
    expect(html).toContain("Confidentialité et sécurité");
    expect(html).toContain("<strong>Ouvrir quand même</strong>");
    expect(rightClickInstruction).toBeGreaterThan(-1);
    expect(settingsInstruction).toBeGreaterThan(rightClickInstruction);
  });
});
