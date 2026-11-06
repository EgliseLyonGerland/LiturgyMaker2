import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Lyrics, SongWithId } from "@/lib/schemas";

import { SongInformationDrawer } from "../song-information-drawer";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

vi.mock("../ui/drawer", () => ({
  Drawer: ({ children }: { children: ReactNode }) => <>{children}</>,
  DrawerTrigger: ({ render }: { render: ReactNode }) => <>{render}</>,
  DrawerContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  DrawerHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DrawerFooter: ({ children }: { children: ReactNode }) => <footer>{children}</footer>,
}));

const song: SongWithId = {
  id: "song-1",
  title: "Mon chant",
  aka: "Autre titre",
  authors: "Auteur",
  number: "12",
  copyright: "",
  translation: "",
  collection: "",
  previewUrl: "",
  lyrics: [{ type: "verse", text: "Original verse" }],
};

function render(lyrics?: Lyrics) {
  return renderToStaticMarkup(
    <SongInformationDrawer
      song={song}
      lyrics={lyrics}
      trigger={<button>Informations</button>}
      footer={<button>Modifier les paroles</button>}
    />,
  );
}

describe("SongInformationDrawer", () => {
  it("displays the song metadata, original lyrics and provided actions", () => {
    const html = render();
    expect(html).toContain("Mon chant");
    expect(html).toContain("Autre titre");
    expect(html).toContain("Auteur");
    expect(html).toContain("Original verse");
    expect(html).toContain("<button>Informations</button>");
    expect(html).toContain("<footer><button>Modifier les paroles</button></footer>");
  });

  it("displays overridden lyrics instead of the originals", () => {
    const html = render([
      { type: "verse", text: " Modified verse \n\n Second line " },
      { type: "chorus", text: "Modified chorus" },
    ]);
    expect(html).toContain("Modified verse");
    expect(html).toContain("Second line");
    expect(html).toContain("Modified chorus");
    expect(html).not.toContain("Original verse");
    expect(song.lyrics).toEqual([{ type: "verse", text: "Original verse" }]);
  });

  it("honors an explicitly empty override", () => {
    expect(render([])).not.toContain("Original verse");
  });

  it("displays a fallback for missing authors without rendering an absent footer", () => {
    const html = renderToStaticMarkup(
      <SongInformationDrawer
        song={{ ...song, authors: "", aka: "" }}
        trigger={<button>Informations</button>}
      />,
    );
    expect(html).toContain("Aucun auteur");
    expect(html).not.toContain("Autre titre");
    expect(html).not.toContain("<footer");
  });

  it("includes the song preview when a URL is available", () => {
    const html = renderToStaticMarkup(
      <SongInformationDrawer
        song={{ ...song, previewUrl: "https://drive.google.com/file/d/example/view" }}
        trigger={<button>Informations</button>}
      />,
    );
    expect(html).toContain('src="https://drive.google.com/file/d/example/preview"');
    expect(html).toContain('title="Aperçu du chant Mon chant"');
  });
});
