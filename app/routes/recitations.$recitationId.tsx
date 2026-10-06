import { useLens, type Lens } from "@hookform/lenses";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon, XIcon } from "lucide-react";
import { get } from "radashi";
import { useCallback } from "react";
import { useForm, useFormState } from "react-hook-form";
import { redirect, useBlocker, useFetcher } from "react-router";
import * as v from "valibot";

import { DiscardAlertDialog } from "@/components/discard-alert-dialog";
import { PassageFieldArray } from "@/components/lyrics-field-array";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { getRecitations, updateRecitation } from "@/lib/api";
import { recitationSchema, type Recitation } from "@/lib/schemas";

import type { Route } from "./+types/recitations.$recitationId";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const recitations = await getRecitations();

  const recitation = recitations.find((item) => item.id === params.recitationId);

  if (!recitation) {
    throw new Error("Recitation not found");
  }

  return { recitation };
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const { recitationId } = params;
  const data = await request.json();

  try {
    const output = v.parse(recitationSchema, data);

    await updateRecitation(recitationId, output);

    return redirect("/recitations");
  } catch {
    toast.add({
      title: "Echec de l'enregistrement",
      type: "error",
    });
  }
}

export default function RecitationEdit({ loaderData }: Route.ComponentProps) {
  const { recitation } = loaderData;
  const fetcher = useFetcher();

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: valibotResolver(recitationSchema),
    defaultValues: recitation,
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
            form="edit-recitation-form"
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
          id="edit-recitation-form"
          onSubmit={handleSubmit((data) => {
            return fetcher.submit(data, {
              method: "post",
              encType: "application/json",
            });
          })}
        >
          <RecitationForm lens={lens} />
        </form>
      </div>

      {blocker.state === "blocked" && <DiscardAlertDialog blocker={blocker} />}
    </>
  );
}

interface RecitationFormProps {
  lens: Lens<Recitation>;
}

export function RecitationForm({ lens }: RecitationFormProps) {
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
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>Texte</FieldLegend>
        <FieldDescription></FieldDescription>
        <FieldGroup>
          <PassageFieldArray kind="recitation" lens={lens.focus("content")} />
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}
