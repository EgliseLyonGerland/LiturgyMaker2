import { cn } from "cn";
import Fuse from "fuse.js";
import { EllipsisVerticalIcon, PenIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Outlet, useFetcher, useLocation, useNavigate } from "react-router";
import { useDebounceValue } from "usehooks-ts";

import {
  ConfirmDropdown,
  ConfirmDropdownActions,
  ConfirmDropdownCancel,
  ConfirmDropdownConfirm,
  ConfirmDropdownContent,
  ConfirmDropdownTitle,
  ConfirmDropdownTrigger,
} from "@/components/confirm-dropdown";
import { HeaderSlot } from "@/components/header-slot";
import { Title } from "@/components/title";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { deleteRecitation, getRecitations } from "@/lib/api";
import { highlightMatches } from "@/lib/fuzy";

import type { Route } from "./+types/recitations";

export async function clientLoader() {
  const recitations = await getRecitations();

  return { recitations };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  const id = formData.get("id");

  try {
    if (action === "delete" && typeof id === "string") {
      await deleteRecitation(id);
    }
  } catch {
    toast.add({
      title: "Erreur",
      description: "Une erreur est survenue lors de la suppression de la récitation.",
      type: "error",
    });
  }
}

export default function Recitations(props: Route.ComponentProps) {
  const {
    loaderData: { recitations },
    params: { recitationId },
  } = props;

  const { submit } = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { control, register, setValue } = useForm<{ search: string }>({
    defaultValues: {
      search: "",
    },
  });

  const search = useWatch({ control, name: "search" });
  const [debouncedSearch] = useDebounceValue(search, 200);

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

  const results = useMemo(() => {
    return fuse.search(debouncedSearch);
  }, [fuse, debouncedSearch]);

  return (
    <>
      <Title>Récitations</Title>
      <HeaderSlot>
        <div className="flex items-center">
          <h1 className="ml-2">Récitations</h1>

          <Button
            className="ml-auto"
            onClick={() => navigate("create", { preventScrollReset: true })}
          >
            <span className="hidden md:block">Ajouter une récitation</span>
            <PlusIcon className="md:hidden" />
          </Button>
        </div>
      </HeaderSlot>
      <main className="mb-[30vh]">
        <div className="sticky top-16 z-10 backdrop-blur-2xl">
          <div className="flex w-full max-w-5xl items-center p-4 md:px-8">
            <label className="relative block w-full max-w-60">
              <InputGroup>
                <InputGroupInput placeholder="Recherche…" type="search" {...register("search")} />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </label>

            <div className="ml-auto text-sm text-muted-foreground">
              {results.length} {results.length > 1 ? "récitations" : "récitation"}
              {results.length !== recitations.length && ` sur ${recitations.length}`}
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl px-4 md:px-8">
          {results.length > 0 ? (
            <div>
              {results.map(({ item, matches }) => {
                const titleMatch = matches?.find((m) => m.key === "title")?.indices ?? [];
                const contentMatch = matches?.find((m) => m.key === "content")?.indices ?? [];

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] items-center border-b border-muted-foreground/10 py-3 last:border-b-0 md:py-4"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-medium text-balance">
                          {highlightMatches(item.title, titleMatch)}
                        </span>
                      </div>
                      {contentMatch.length > 0 && (
                        <div className="mt-4 max-w-full text-xs text-muted-foreground">
                          {highlightMatches(item.content, contentMatch.slice(0, 1), 40)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          navigate(`/recitations/${item.id}`, { preventScrollReset: true })
                        }
                      >
                        <PenIcon />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button type="button" variant="ghost" size="icon">
                              <EllipsisVerticalIcon />
                            </Button>
                          }
                        />
                        <DropdownMenuContent className="w-auto" align="start">
                          <DropdownMenuGroup>
                            <ConfirmDropdown>
                              <ConfirmDropdownTrigger
                                nativeButton={false}
                                render={
                                  <DropdownMenuItem
                                    tabIndex={-1}
                                    closeOnClick={false}
                                    variant="destructive"
                                  >
                                    <TrashIcon />
                                    Supprimer
                                  </DropdownMenuItem>
                                }
                              />
                              <ConfirmDropdownContent>
                                <ConfirmDropdownTitle>
                                  Êtes-vous sûr de vouloir supprimer cette récitation ?
                                </ConfirmDropdownTitle>
                                <ConfirmDropdownActions>
                                  <ConfirmDropdownCancel>Non</ConfirmDropdownCancel>
                                  <ConfirmDropdownConfirm
                                    onClick={() => {
                                      submit({ action: "delete", id: item.id }, { method: "post" });
                                    }}
                                  >
                                    Oui
                                  </ConfirmDropdownConfirm>
                                </ConfirmDropdownActions>
                              </ConfirmDropdownContent>
                            </ConfirmDropdown>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Aucune récitation trouvée</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => {
                    setValue("search", "");
                  }}
                >
                  Supprimer le filtre
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </main>

      <Drawer
        open={!!recitationId || location.pathname === "/recitations/create"}
        onOpenChange={(open) => {
          if (!open) {
            navigate("/recitations", { preventScrollReset: true });
          }
        }}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent className={cn(!isMobile && "w-[90%] max-w-xl")}>
          <Outlet />
        </DrawerContent>
      </Drawer>
    </>
  );
}
