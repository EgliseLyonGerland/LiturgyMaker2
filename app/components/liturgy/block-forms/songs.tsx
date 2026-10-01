import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useLens, type Lens } from "@hookform/lenses";
import { cn } from "cn";
import { AlertTriangleIcon, PlusIcon, SaveIcon, TrashIcon, XIcon } from "lucide-react";
import { get } from "radashi";
import { useEffect, useRef } from "react";
import {
  FormProvider,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
  Watch,
} from "react-hook-form";
import Player from "react-player";
import { create } from "zustand";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { LyricsFieldArray } from "@/components/lyrics-field-array";
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
} from "@/components/ui/combobox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { isEqualLyrics, prepareLyrics } from "@/lib/lyrics-utils";
import { type Liturgy, type Lyrics, type Song, type SongsBlock } from "@/lib/schemas";

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
  index: number;
  songs: Song[];
}

export function SongsBlockForm({ index, songs }: SongsBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `blocks.${index}.data.items`,
  });

  return (
    <>
      <LiturgyCard type="songs">
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
            onClick={() => {
              append({ id: "", infos: "", lyrics: null, repeat: false });
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
  songs: Song[];
  actionsDisabled?: boolean;
  sortable?: boolean;
  onRemove: () => void;
}

function Item({ id, index, name, songs, sortable, onRemove }: ItemProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });
  const isMobile = useIsMobile();

  const idName = `${name}.id` as const;
  const infosName = `${name}.infos` as const;
  const repeatName = `${name}.repeat` as const;
  const lyricsName = `${name}.lyrics` as const;

  const idField = useController({ control, name: idName });

  const lens = useLens({ control });

  const song = songs.find((song) => song.id === idField.field.value);

  return (
    <div ref={ref}>
      <FieldSet>
        <div className={cn("items-center gap-2", sortable ? "flex" : "hidden")}>
          <SortableButton ref={handleRef} />

          <FieldLegend variant="label" className="m-0 mr-auto opacity-60">
            Chant {index + 1}
          </FieldLegend>

          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <TrashIcon />
          </Button>
        </div>

        <div className="flex">
          {sortable && <div className="mr-4 ml-2 w-px bg-border" />}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={name}>Chant</FieldLabel>
              <Combobox
                items={songs}
                itemToStringLabel={(song) => song.title}
                value={song}
                onValueChange={(song) => {
                  if (song) {
                    idField.field.onChange(song.id);
                  }
                }}
                autoHighlight
              >
                <ComboboxInput
                  id={name}
                  name={name}
                  placeholder="Choisissez un chant"
                  className="flex-1"
                  onBlur={idField.field.onBlur}
                />
                <ComboboxContent>
                  <ComboboxEmpty>Auncun chant trouvé</ComboboxEmpty>
                  <ComboboxList>
                    {(song: Song) => (
                      <ComboboxItem key={song.id} value={song}>
                        {song.title} {song.aka && `(${song.aka})`}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>

            <Watch
              control={control}
              name={lyricsName}
              render={(value) =>
                value !== null && (
                  <Alert className="border-orange-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                    <AlertTriangleIcon />
                    <AlertTitle>Les paroles de ce chant ont été modifiées.</AlertTitle>
                    <AlertAction>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setValue(lyricsName, null);
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
                className="min-h-lh"
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

              {song && (
                <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
                  <DrawerTrigger
                    render={
                      <Button type="button" size="sm" variant="outline">
                        Informations
                      </Button>
                    }
                  />
                  <DrawerContent className="w-[90%] max-w-xl">
                    <ItemInformationDrawerContent lens={lens.focus(lyricsName)} song={song} />
                  </DrawerContent>
                </Drawer>
              )}
            </div>
          </FieldGroup>
        </div>
      </FieldSet>
    </div>
  );
}

interface ItemInformationDrawerContentProps {
  lens: Lens<Lyrics | null>;
  song: Song;
}

function ItemInformationDrawerContent({ lens, song }: ItemInformationDrawerContentProps) {
  const drawerOpen = useLyricsEdit((state) => state.open);
  const setDrawerOpen = useLyricsEdit((state) => state.setOpen);
  const requestDiscard = useLyricsEdit((state) => state.requestDiscard);
  const isMobile = useIsMobile();

  const lyricsField = useController(lens.interop());

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-lg">
          {song.title} {song.aka && <span>({song.aka})</span>}
        </DrawerTitle>
        <DrawerDescription>{song.authors || <i>Aucun auteur</i>}</DrawerDescription>
      </DrawerHeader>

      <Separator className="my-4" />

      <div className="flex-1 scroll-fade overflow-y-auto px-4">
        {song.previewUrl && (
          <>
            <Preview title={song.title} url={song.previewUrl} />
            <Separator className="my-4" />
          </>
        )}

        <div className="mb-10 flex flex-col gap-4">
          {prepareLyrics(song.lyrics).map(({ type, lines }, lyricIndex) => (
            <div key={lyricIndex}>
              {lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className={cn("pl-4 -indent-4 sm:tracking-wide", type === "chorus" && "pl-8")}
                >
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <DrawerFooter>
        <Watch
          {...lens.interop()}
          render={(value) =>
            value !== null && (
              <Alert className="border-orange-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                <AlertTriangleIcon />
                <AlertTitle>Les paroles de ce chant ont été modifiées.</AlertTitle>
                <AlertAction>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => {
                      lyricsField.field.onChange(null);
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
          <DrawerContent className="w-[90%] max-w-xl">
            <EditLyricsDrawerContent lens={lens} song={song} />
          </DrawerContent>
        </Drawer>
      </DrawerFooter>
    </>
  );
}

interface PreviewProps {
  title: string;
  url: string;
}

function Preview({ title, url }: PreviewProps) {
  if (url.includes("drive.google.com")) {
    return (
      <iframe
        height="140"
        src={url.replace("/view", "/preview")}
        title={`${title} preview`}
        width="100%"
        loading="lazy"
      />
    );
  }

  return <Player src={url} width="100%" height={260} controls />;
}

interface EditLyricsDrawerContentProps {
  lens: Lens<Lyrics | null>;
  song: Song;
}

function EditLyricsDrawerContent({ lens, song }: EditLyricsDrawerContentProps) {
  const setOpen = useLyricsEdit((state) => state.setOpen);
  const setDirty = useLyricsEdit((state) => state.setDirty);

  const {
    field: { value, onChange },
  } = useController(lens.interop());

  const form = useForm<{ lyrics: Lyrics }>({
    defaultValues: {
      lyrics: value ?? song.lyrics,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const lyricsLens = useLens({ control });

  useEffect(() => {
    setDirty(isDirty);

    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setDirty(false);
    };
  }, [isDirty, setDirty]);

  return (
    <FormProvider {...form}>
      <DrawerHeader>
        <div className="flex justify-between gap-2">
          <DrawerClose
            render={
              <Button type="button" variant="ghost" size="icon">
                <XIcon />
              </Button>
            }
          />

          <Button form="edit-lyrics-form" type="submit" variant="default" disabled={!isDirty}>
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
          <LyricsFieldArray lens={lyricsLens.focus("lyrics")} />
        </form>
      </div>
    </FormProvider>
  );
}
