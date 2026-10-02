import { collection, getDocs, query } from "firebase/firestore";
import Fuse from "fuse.js";
import { PenIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

import { HeaderSlot } from "@/components/header-slot";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { firebaseDb } from "@/lib/firebase";
import { highlightMatches } from "@/lib/fuzy";
import { queryClient } from "@/lib/query-client";
import type { Recitation } from "@/lib/schemas";

import type { Route } from "./+types/recitations";

export async function clientLoader() {
  const recitations = await queryClient.query({
    queryKey: ["recitations"],
    queryFn: async () => {
      const { docs } = await getDocs(query(collection(firebaseDb, "recitations")));

      return docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Recitation,
        )
        .toSorted((left, right) =>
          String(left.title ?? "").localeCompare(String(right.title ?? ""), "fr"),
        );
    },
    staleTime: Infinity,
  });

  return { recitations };
}

export default function Recitations(props: Route.ComponentProps) {
  const {
    loaderData: { recitations },
  } = props;

  const [search, setSearch] = useState("");
  const [deboucedSearch] = useDebounceValue(search, 200);

  const fuse = useMemo(() => {
    return new Fuse(
      recitations.map((recitation) => ({
        ...recitation,
        content: (recitation.content || []).map((line) => line.text).join("\n"),
      })),
      {
        keys: ["title", "content"],
        ignoreDiacritics: true,
        includeMatches: true,
        threshold: 0.2,
        distance: Infinity,
      },
    );
  }, [recitations]);

  const filteredRecitations = useMemo(() => {
    return fuse.search(deboucedSearch);
  }, [fuse, deboucedSearch]);

  return (
    <>
      <HeaderSlot>
        <h1 className="ml-2">Récitations</h1>
      </HeaderSlot>
      <main className="mb-[30vh]">
        <div className="sticky top-16 z-10 backdrop-blur-2xl">
          <div className="flex w-full max-w-5xl items-center px-4 py-6 md:px-8">
            <label className="relative block w-full max-w-sm">
              <InputGroup>
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
              {filteredRecitations.length}{" "}
              {filteredRecitations.length > 1 ? "récitations" : "récitation"}
              {filteredRecitations.length !== recitations.length && ` sur ${recitations.length}`}
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl px-4 md:px-8">
          <Table>
            <TableBody>
              {filteredRecitations.map(({ item, matches }) => {
                const titleMatch = matches?.find((m) => m.key === "title")?.indices ?? [];
                const contentMatch = matches?.find((m) => m.key === "content")?.indices ?? [];

                return (
                  <TableRow key={item.id}>
                    <TableCell className="py-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium">
                          {highlightMatches(item.title, titleMatch)}
                        </span>
                      </div>
                      {contentMatch.length > 0 && (
                        <div className="mt-4 max-w-full text-xs text-muted-foreground">
                          {highlightMatches(item.content, contentMatch.slice(0, 1), 40)}
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
