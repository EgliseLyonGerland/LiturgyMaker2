import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useLens, type Lens } from "@hookform/lenses";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { cn } from "cn";
import Fuse from "fuse.js";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  InfoIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { get } from "radashi";
import { useEffect, useMemo, useRef, useState } from "react";
import { useController, useFieldArray, useForm, useFormContext, Watch } from "react-hook-form";
import * as v from "valibot";
import { create } from "zustand";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { PassageFieldArray } from "@/components/lyrics-field-array";
import { SongInformationDrawer } from "@/components/song-information-drawer";
import { Alert, AlertAction, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useIsMobile } from "@/hooks/use-mobile";
import { highlightMatches } from "@/lib/fuzy";
import { getBlockFocusName } from "@/lib/liturgy-form-utils";
import { isEqualLyrics } from "@/lib/lyrics-utils";
import {
  lyricsFormSchema,
  type Liturgy,
  type Lyrics,
  type Song,
  type SongsBlock,
  type SongWithId,
} from "@/lib/schemas";

import { SortableButton } from "../sortable-button";

interface FieldValues extends Liturgy {
  blocks: SongsBlock[];
}

interface LyricsEditState {
  open: boolean;
  dirty: boolean;
  pendingDiscard: boolean;
  setOpen: (open: boolean) => void;
  setDirty: (dirty: boolean) => void;
  requestDiscard: () => void;
  cancelDiscard: () => void;
}

const useLyricsEdit = create<LyricsEditState>((set) => ({
  open: false,
  dirty: false,
  pendingDiscard: false,
  setOpen: (open) => set(() => ({ open })),
  setDirty: (dirty) => set(() => ({ dirty })),
  requestDiscard: () =>
    set(({ dirty }) =>
      dirty ? { pendingDiscard: dirty } : { open: false, pendingDiscard: false, dirty: false },
    ),
  cancelDiscard: () => set(() => ({ pendingDiscard: false })),
}));

interface SongsBlockFormProps {
  id: string;
  index: number;
  songs: SongWithId[];
}

export function SongsBlockForm({ id, index, songs }: SongsBlockFormProps) {
  const {
    control,
    formState: { disabled },
  } = useFormContext<FieldValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `blocks.${index}.data.items`,
  });

  return (
    <>
      <LiturgyCard id={id} type="songs" disabled={disabled}>
        <LiturgyCardHeader>
          <LiturgyCardTitle />
        </LiturgyCardHeader>

        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) return;

            const { source } = event.operation;

            if (isSortable(source)) {
              const { initialIndex, index } = source;

              move(initialIndex, index);
            }
          }}
        >
          <LiturgyCardContent className="flex flex-col gap-8">
            {fields.map((field, fieldIndex) => (
              <Item
                key={field.id}
                id={field.id}
                index={fieldIndex}
                name={`blocks.${index}.data.items.${fieldIndex}`}
                songs={songs}
                onRemove={() => {
                  remove(fieldIndex);
                }}
                sortable={fields.length > 1}
              />
            ))}
          </LiturgyCardContent>
        </DragDropProvider>

        <LiturgyCardFooter>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              append(
                { id: "", infos: "", lyrics: [], repeat: false },
                { focusName: getBlockFocusName("songs", index, fields.length) },
              );
            }}
          >
            Ajouter un chant <PlusIcon />
          </Button>
        </LiturgyCardFooter>
      </LiturgyCard>

      <DiscardLyricsChangesDialog />
    </>
  );
}

function DiscardLyricsChangesDialog() {
  const setOpen = useLyricsEdit((state) => state.setOpen);
  const pendingDiscard = useLyricsEdit((state) => state.pendingDiscard);
  const cancelDiscard = useLyricsEdit((state) => state.cancelDiscard);

  return (
    <AlertDialog
      open={pendingDiscard}
      onOpenChange={(open) => {
        if (!open) {
          cancelDiscard();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner les modifications ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les modifications apportées aux paroles n'ont pas été enregistrées et seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuer l'édition</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              cancelDiscard();
            }}
          >
            Abandonner
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ItemProps {
  id: string;
  index: number;
  name: `blocks.${number}.data.items.${number}`;
  songs: SongWithId[];
  actionsDisabled?: boolean;
  sortable?: boolean;
  onRemove: () => void;
}

function Item({ id, index, name, songs, sortable, onRemove }: ItemProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors, disabled },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref: sortableRef } = useSortable({ id, index, handle: handleRef });
  const [query, setQuery] = useState("");

  const idName = `${name}.id` as const;
  const infosName = `${name}.infos` as const;
  const repeatName = `${name}.repeat` as const;
  const lyricsName = `${name}.lyrics` as const;

  const {
    field: { value, onChange },
  } = useController({ control, name: idName });

  const lens = useLens({ control });

  const selectedSong = songs.find((item) => item.id === value);

  const items = useMemo(
    () =>
      songs.map((song) => ({
        ...song,
        title: song.aka ? `${song.title} (${song.aka})` : song.title,
        lyrics: (song.lyrics || []).map((line) => line.text).join("\n"),
      })),
    [songs],
  );

  const selectedItem = items.find((item) => item.id === value);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "authors", "lyrics"],
        ignoreDiacritics: true,
        includeMatches: true,
        threshold: 0.2,
        distance: Infinity,
      }),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      query.trim()
        ? fuse.search(query).map(({ item, matches }) => ({ ...item, matches }))
        : items.map((item) => ({ ...item, matches: [] })),
    [fuse, items, query],
  );

  return (
    <div ref={sortableRef} className="group">
      <FieldSet>
        <div className={cn("items-center gap-2", sortable ? "flex" : "hidden")}>
          <SortableButton ref={handleRef} aria-label={`Déplacer le chant ${index + 1}`} />

          <FieldLegend variant="label" className="m-0 mr-auto opacity-60">
            Chant {index + 1}
          </FieldLegend>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            aria-label={`Supprimer le chant ${index + 1}`}
            className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100"
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
        </div>

        <div className="flex">
          {sortable && <div className="mr-4 ml-2 w-px bg-border" />}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={idName}>Chant</FieldLabel>
              <Combobox
                items={items}
                filteredItems={filteredItems}
                value={selectedItem}
                onInputValueChange={setQuery}
                onValueChange={(item) => {
                  if (item) {
                    onChange(item.id);
                  }
                }}
                autoHighlight
              >
                <ComboboxTrigger
                  render={
                    <Button
                      id={idName}
                      variant="outline"
                      disabled={disabled}
                      className="h-auto justify-between py-2 text-left"
                      aria-invalid={!!get(errors, idName)}
                    >
                      <ComboboxValue placeholder="Choisissez un chant">
                        {(selectedItem: (typeof items)[number] | null) =>
                          selectedItem ? (
                            <div className="flex flex-col gap-1">
                              <span>{selectedItem.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {selectedItem.authors ?? <i>Aucun auteur</i>}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Choisissez un chant</span>
                          )
                        }
                      </ComboboxValue>

                      <ChevronDownIcon />
                    </Button>
                  }
                />

                <ComboboxContent>
                  <ComboboxInput
                    showTrigger={false}
                    placeholder="Rechercher un chant…"
                    aria-label="Rechercher un chant"
                  />
                  <ComboboxEmpty>Auncun chant trouvé</ComboboxEmpty>
                  <ComboboxList>
                    {({ matches, ...item }: (typeof filteredItems)[number]) => {
                      const titleMatch = matches?.find((m) => m.key === "title")?.indices ?? [];
                      const authorsMatch = matches?.find((m) => m.key === "authors")?.indices ?? [];
                      const lyricsMatch = matches?.find((m) => m.key === "lyrics")?.indices ?? [];

                      return (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                          className="flex flex-col items-start gap-1 py-2"
                        >
                          <span>{highlightMatches(item.title, titleMatch)}</span>
                          <span
                            className={cn(
                              "text-xs text-muted-foreground!",
                              !item.authors && "italic",
                            )}
                          >
                            {highlightMatches(item.authors, authorsMatch) || "Aucun auteur"}
                          </span>
                          {lyricsMatch.length > 0 && (
                            <div className="my-1 w-full max-w-full rounded border bg-black/5 p-1 text-xs text-muted-foreground/60! italic">
                              {highlightMatches(item.lyrics, lyricsMatch.slice(0, 1), 50)}
                            </div>
                          )}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>

            <Watch
              control={control}
              name={lyricsName}
              render={(value) =>
                value.length > 0 && (
                  <Alert className="border-orange-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                    <AlertTriangleIcon />
                    <AlertTitle>Les paroles de ce chant ont été modifiées.</AlertTitle>
                    <AlertAction>
                      <Button
                        size="xs"

                        onClick={() => {
                          setValue(lyricsName, [], { shouldDirty: true });
                        }}
                      >
                        Rétablir
                      </Button>
                    </AlertAction>
                  </Alert>
                )
              }
            />

            <Field>
              <FieldLabel htmlFor={infosName}>Infos</FieldLabel>
              <Textarea
                id={infosName}
                {...register(infosName)}
                aria-invalid={!!get(errors, infosName)}
              />
            </Field>

            <div className="grid grid-cols-[1fr_auto] items-center">
              <Field orientation="horizontal">
                <Checkbox id={repeatName} {...register(repeatName)} />
                <FieldContent>
                  <FieldLabel htmlFor={repeatName}>Chanter deux fois</FieldLabel>
                </FieldContent>
              </Field>

              {selectedSong && (
                <Watch
                  control={control}
                  name={lyricsName}
                  render={(lyrics) => (
                    <SongInformationDrawer
                      song={selectedSong}
                      lyrics={lyrics.length ? lyrics : undefined}
                      trigger={
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={disabled}
                          aria-label={`Informations sur le chant ${selectedSong.title}`}
                        >
                          Informations <InfoIcon />
                        </Button>
                      }
                      footer={
                        <EditLyricsDrawer lens={lens.focus(lyricsName)} song={selectedSong} />
                      }
                    />
                  )}
                />
              )}
            </div>
          </FieldGroup>
        </div>
      </FieldSet>
    </div>
  );
}

interface EditLyricsDrawerProps {
  lens: Lens<Lyrics>;
  song: Song;
}

function EditLyricsDrawer(props: EditLyricsDrawerProps) {
  const { lens, song } = props;

  const drawerOpen = useLyricsEdit((state) => state.open);
  const setDrawerOpen = useLyricsEdit((state) => state.setOpen);
  const requestDiscard = useLyricsEdit((state) => state.requestDiscard);
  const isMobile = useIsMobile();

  const lyricsField = useController(lens.interop());

  return (
    <>
      <Watch
        {...lens.interop()}
        render={(value) =>
          value.length > 0 && (
            <Alert className="border-orange-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <AlertTriangleIcon />
              <AlertTitle>Les paroles de ce chant ont été modifiées.</AlertTitle>
              <AlertAction>
                <Button
                  size="xs"

                  onClick={() => {
                    lyricsField.field.onChange([]);
                  }}
                >
                  Rétablir
                </Button>
              </AlertAction>
            </Alert>
          )
        }
      />

      <Drawer
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
        open={drawerOpen}
        onOpenChange={(open) => {
          if (open) {
            setDrawerOpen(true);
          } else {
            requestDiscard();
          }
        }}
      >
        <DrawerTrigger
          render={
            <Button type="button" size="lg">
              Modifier les paroles pour ce culte
            </Button>
          }
        />
        <DrawerContent className={cn(!isMobile && "w-[90%] max-w-xl")}>
          <EditLyricsDrawerContent lens={lens} song={song} />
        </DrawerContent>
      </Drawer>
    </>
  );
}

const editLyricsFormSchema = v.object({
  lyrics: lyricsFormSchema,
});

function EditLyricsDrawerContent({ lens, song }: EditLyricsDrawerProps) {
  const setOpen = useLyricsEdit((state) => state.setOpen);
  const setDirty = useLyricsEdit((state) => state.setDirty);

  const {
    field: { value, onChange },
  } = useController(lens.interop());

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: valibotResolver(editLyricsFormSchema),
    defaultValues: {
      lyrics: value.length > 0 ? value : song.lyrics,
    },
  });

  const lyricsLens = useLens({ control });

  useBeforeUnload(isDirty);

  useEffect(() => {
    setDirty(isDirty);

    return () => {
      setDirty(false);
    };
  }, [isDirty, setDirty]);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="sr-only">Modifier les paroles de {song.title}</DrawerTitle>
        <div className="flex justify-between gap-2">
          <DrawerClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fermer l'édition des paroles"
              >
                <XIcon />
              </Button>
            }
          />

          <Button form="edit-lyrics-form" type="submit" disabled={!isDirty}>
            Enregistrer <SaveIcon />
          </Button>
        </div>
      </DrawerHeader>
      <div className="scroll-fade overflow-y-auto p-4 pb-10">
        <form
          id="edit-lyrics-form"
          onSubmit={(event) => {
            event?.stopPropagation();

            handleSubmit((data) => {
              if (isEqualLyrics(data.lyrics, song.lyrics)) {
                onChange(null);
              } else {
                onChange(data.lyrics);
              }

              setDirty(false);
              setOpen(false);
            })(event);
          }}
        >
          <PassageFieldArray kind="song" lens={lyricsLens.focus("lyrics")} />
        </form>
      </div>
    </>
  );
}
