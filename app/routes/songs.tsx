import { collection, getDocs, query } from "firebase/firestore";
import Fuse from "fuse.js";
import { PenIcon, SearchIcon } from "lucide-react";
import { useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";

import { HeaderSlot } from "@/components/header-slot";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { firebaseDb } from "@/lib/firebase";
import { highlightMatches } from "@/lib/fuzy";
import { queryClient } from "@/lib/query-client";
import type { Song } from "@/lib/schemas";

import type { Route } from "./+types/songs";

export async function clientLoader() {
  const songs = await queryClient.query({
    queryKey: ["songs", "catalog"],
    queryFn: async () => {
      const { docs } = await getDocs(query(collection(firebaseDb, "songs")));

      return docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Song,
        )
        .toSorted((left, right) =>
          String(left.title ?? "").localeCompare(String(right.title ?? ""), "fr"),
        );
    },
    staleTime: Infinity,
  });

  return { songs };
}

export default function Songs(props: Route.ComponentProps) {
  const {
    loaderData: { songs },
  } = props;

  const [search, setSearch] = useDebounceValue("", 200);

  const fuse = useMemo(() => {
    return new Fuse(
      songs.map((song) => ({
        ...song,
        lyrics: (song.lyrics || []).map((line) => line.text).join("\n"),
      })),
      {
        keys: ["title", "author", "aka", "lyrics"],
        ignoreDiacritics: true,
        includeMatches: true,
        threshold: 0.3,
      },
    );
  }, [songs]);

  const filteredSongs = useMemo(() => {
    return fuse.search(search);
  }, [fuse, search]);

  return (
    <>
      <HeaderSlot>
        <h1 className="ml-2">Chants</h1>
      </HeaderSlot>
      <main>
        <div className="sticky top-16 z-10 backdrop-blur-2xl">
          <div className="flex w-full max-w-5xl items-center px-4 py-6 md:px-8">
            <label className="relative block">
              <InputGroup className="max-w-xs">
                <InputGroupInput
                  placeholder="Recherche..."
                  type="search"
                  onChange={(event) => setSearch(event.target.value)}
                />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </label>

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredSongs.length} {filteredSongs.length > 1 ? "chants" : "chant"}
              {filteredSongs.length !== songs.length && ` sur ${songs.length}`}
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl px-4 md:px-8">
          <Table>
            <TableBody>
              {filteredSongs.map(({ item, matches }) => {
                const titleMatch = matches?.find((m) => m.key === "title")?.indices ?? [];
                const akaMatch = matches?.find((m) => m.key === "aka")?.indices ?? [];
                const authorsMatch = matches?.find((m) => m.key === "authors")?.indices ?? [];
                const lyricsMatch = matches?.find((m) => m.key === "lyrics")?.indices ?? [];

                return (
                  <TableRow key={item.id}>
                    <TableCell className="py-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium">
                          {highlightMatches(item.title, titleMatch)}
                        </span>
                        {item.aka && (
                          <span className="text-muted-foreground">
                            ({highlightMatches(item.aka, akaMatch)})
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {item.authors ? (
                          highlightMatches(item.authors, authorsMatch)
                        ) : (
                          <i>Auteur non renseigné</i>
                        )}
                      </div>
                      {lyricsMatch.length > 0 && (
                        <div className="mt-4 max-w-full text-xs text-muted-foreground">
                          {highlightMatches(item.lyrics, lyricsMatch.slice(0, 1), 40)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell align="right" className="py-4">
                      <Button variant="outline" size="icon">
                        <PenIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
