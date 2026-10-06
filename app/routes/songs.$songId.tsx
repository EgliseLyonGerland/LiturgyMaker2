import { useLens, type Lens } from "@hookform/lenses";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { CopyrightIcon, SaveIcon, XIcon } from "lucide-react";
import { get } from "radashi";
import { useCallback } from "react";
import { useForm, useFormState, Watch } from "react-hook-form";
import { redirect, useBlocker, useFetcher } from "react-router";
import * as v from "valibot";

import { DiscardAlertDialog } from "@/components/discard-alert-dialog";
import { PassageFieldArray } from "@/components/lyrics-field-array";
import Preview from "@/components/preview";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerHeader } from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { getSongs, updateSong } from "@/lib/api";
import { songSchema, type Song } from "@/lib/schemas";

import type { Route } from "./+types/songs.$songId";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const songs = await getSongs();

  const song = songs.find((item) => item.id === params.songId);

  if (!song) {
    throw new Error("Song not found");
  }

  return { song };
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const { songId } = params;
  const data = await request.json();

  try {
    const output = v.parse(songSchema, data);

    await updateSong(songId, output);

    return redirect("/songs");
  } catch {
    toast.add({
      title: "Echec de l'enregistrement",
      type: "error",
    });
  }
}

export default function SongEdit({ loaderData }: Route.ComponentProps) {
  const { song } = loaderData;
  const fetcher = useFetcher();

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: valibotResolver(songSchema),
    defaultValues: song,
    disabled: fetcher.state !== "idle",
  });

  const lens = useLens({ control });

  const blocker = useBlocker(useCallback(() => isDirty, [isDirty]));

  useBeforeUnload(isDirty);

  return (
    <>
      <DrawerHeader>
        <div className="flex justify-between gap-2">
          <DrawerClose
            render={
              <Button type="button" variant="ghost" size="icon">
                <XIcon />
              </Button>
            }
          />

          <Button
            form="edit-song-form"
            type="submit"
            disabled={!isDirty || fetcher.state !== "idle"}
          >
            {fetcher.state !== "idle" && <Spinner />}
            Enregistrer <SaveIcon />
          </Button>
        </div>
      </DrawerHeader>
      <div className="scroll-fade overflow-y-auto p-4 pb-10">
        <form
          id="edit-song-form"
          onSubmit={handleSubmit((data) => {
            return fetcher.submit(data, {
              method: "post",
              encType: "application/json",
            });
          })}
        >
          <SongForm lens={lens} />
        </form>
      </div>

      {blocker.state === "blocked" && <DiscardAlertDialog blocker={blocker} />}
    </>
  );
}

interface SongFormProps {
  lens: Lens<Song>;
}

export function SongForm({ lens }: SongFormProps) {
  const { errors } = useFormState({ control: lens.interop((control) => control) });

  return (
    <FieldGroup>
      <FieldSet>
        <Field>
          <FieldLabel htmlFor="title">Titre</FieldLabel>
          <Input
            id="title"
            {...lens.focus("title").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "title")}
          />
          <FieldError errors={[get(errors, "title")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="aka">Titre secondaire</FieldLabel>
          <Input
            id="aka"
            {...lens.focus("aka").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "aka")}
          />
          <FieldError errors={[get(errors, "aka")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="authors">Auteurs</FieldLabel>
          <Input
            id="authors"
            {...lens.focus("authors").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "authors")}
          />
          <FieldError errors={[get(errors, "authors")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="copyright">Copyrights</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="copyright"
              className="min-h-lh"
              {...lens.focus("copyright").interop((control, name) => control.register(name))}
              aria-invalid={!!get(errors, "copyright")}
            />
            <InputGroupAddon align="inline-start">
              <CopyrightIcon className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[get(errors, "copyright")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="translation">Traduction</FieldLabel>
          <Input
            id="translation"
            {...lens.focus("translation").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "translation")}
          />
          <FieldError errors={[get(errors, "translation")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="collection">Recueils</FieldLabel>
          <Input
            id="collection"
            {...lens.focus("collection").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "collection")}
          />
          <FieldError errors={[get(errors, "collection")]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="previewUrl">Aperçu</FieldLabel>
          <Input
            id="previewUrl"
            {...lens.focus("previewUrl").interop((control, name) => control.register(name))}
            aria-invalid={!!get(errors, "previewUrl")}
          />
          <FieldError errors={[get(errors, "previewUrl")]} />
        </Field>
        <Watch
          {...lens.focus("previewUrl").interop()}
          render={(url) => url && <Preview title="" url={url} />}
        />
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>Paroles</FieldLegend>
        <FieldDescription></FieldDescription>
        <FieldGroup>
          <PassageFieldArray kind="song" lens={lens.focus("lyrics")} />
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}
