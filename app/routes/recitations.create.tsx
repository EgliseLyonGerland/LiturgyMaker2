import { useLens } from "@hookform/lenses";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { SaveIcon, XIcon } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { redirect, useBlocker, useFetcher } from "react-router";
import * as v from "valibot";

import { DiscardAlertDialog } from "@/components/discard-alert-dialog";
import { Title } from "@/components/title";
import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerHeader } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { addRecitation } from "@/lib/api";
import { recitationSchema } from "@/lib/schemas";

import type { Route } from "./+types/recitations.create";
import { RecitationForm } from "./recitations.$recitationId";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const data = await request.json();

  try {
    const output = v.parse(recitationSchema, data);

    await addRecitation(output);

    return redirect("/recitations");
  } catch {
    toast.add({
      title: "Echec de l'enregistrement",
      type: "error",
    });
  }
}

export default function RecitationsCreate() {
  const fetcher = useFetcher();

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: valibotResolver(recitationSchema),
    defaultValues: {
      title: "",
      content: [],
    },
    disabled: fetcher.state !== "idle",
  });

  const lens = useLens({ control });
  const blocker = useBlocker(useCallback(() => isDirty, [isDirty]));

  useBeforeUnload(isDirty);

  return (
    <>
      <Title>Nouvelle récitation</Title>
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
            form="create-recitation-form"
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
          id="create-recitation-form"
          onSubmit={handleSubmit((data) => {
            return fetcher.submit(data, {
              method: "post",
              encType: "application/json",
            });
          }, console.error)}
        >
          <RecitationForm lens={lens} />
        </form>
      </div>

      {blocker.state === "blocked" && <DiscardAlertDialog blocker={blocker} />}
    </>
  );
}
