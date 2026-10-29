import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, subDays } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useBlocker, useFetcher, useNavigation } from "react-router";
import * as v from "valibot";

import { AddButton } from "@/components/add-button";
import {
  ConfirmDropdown,
  ConfirmDropdownActions,
  ConfirmDropdownCancel,
  ConfirmDropdownConfirm,
  ConfirmDropdownContent,
  ConfirmDropdownDescription,
  ConfirmDropdownTitle,
  ConfirmDropdownTrigger,
} from "@/components/confirm-dropdown";
import { DiscardAlertDialog } from "@/components/discard-alert-dialog";
import { HeaderSlot } from "@/components/header-slot";
import { AnnouncementsBlockForm } from "@/components/liturgy/block-forms/announcements";
import { OpenDoorsBlockForm } from "@/components/liturgy/block-forms/open-doors";
import { ReadingBlockForm } from "@/components/liturgy/block-forms/reading";
import { RecitationBlockForm } from "@/components/liturgy/block-forms/recitation";
import { SectionBlockForm } from "@/components/liturgy/block-forms/section";
import { SermonBlockForm } from "@/components/liturgy/block-forms/sermon";
import { SongsBlockForm } from "@/components/liturgy/block-forms/songs";
import { CodeDialog } from "@/components/liturgy/code-dialog";
import { LiturgyHeader } from "@/components/liturgy/header";
import { LiturgyMenu } from "@/components/liturgy/liturgy-menu";
import { Title } from "@/components/title";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { liturgyBlockIcons, liturgyBlockNames, liturgyBlockTypes } from "@/config";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import {
  getLiturgy,
  getRecitations,
  getSongs,
  LiturgyConflictError,
  updateLiturgy,
} from "@/lib/api";
import { createDefaultBlock } from "@/lib/default-liturgy";
import { liturgyBlockContext } from "@/lib/liturgy-context";
import { getBlockFocusName } from "@/lib/liturgy-form-utils";
import { converToDate, convertToId } from "@/lib/liturgy-utils";
import { queryClient } from "@/lib/query-client";
import { liturgySchema, type Liturgy, type LiturgyBlockType } from "@/lib/schemas";
import { userContext } from "@/lib/user-context";

import type { Route } from "./+types/liturgy";

async function getPreviousWeekBlock<T extends LiturgyBlockType>(
  blocks: Liturgy["blocks"],
  date: Date,
  type: T,
  index: number,
) {
  const previousDate = subDays(date, 7);
  const previousId = convertToId(previousDate);
  const previousLiturgy = await getLiturgy(previousId);

  if (!previousLiturgy) {
    return null;
  }

  const currentBlock = blocks[index];

  const currentBlockPosition = blocks
    .filter((block) => block.type === type)
    .findIndex((block) => block === currentBlock);

  const sameTypeBlocks = previousLiturgy.blocks.filter((block) => block.type === currentBlock.type);

  if (sameTypeBlocks.length === 0) {
    return null;
  }

  return sameTypeBlocks[currentBlockPosition] || sameTypeBlocks.pop();
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { liturgyId } = params;

  const [liturgy, songs, recitations] = await Promise.all([
    getLiturgy(liturgyId),
    getSongs(),
    getRecitations(),
  ]);

  return { liturgy, songs, recitations };
}

const submissionSchema = v.variant("intent", [
  v.object({ intent: v.literal("reload") }),
  v.object({
    intent: v.literal("save"),
    liturgy: liturgySchema,
    overwrite: v.boolean(),
  }),
]);

export async function clientAction({ params, request, context }: Route.ClientActionArgs) {
  const user = context.get(userContext);
  const { liturgyId } = params;

  try {
    const submission = v.parse(submissionSchema, await request.json());

    if (submission.intent === "reload") {
      await queryClient.invalidateQueries({
        queryKey: ["liturgies", liturgyId],
        exact: true,
        refetchType: "none",
      });
      await getLiturgy(liturgyId);

      return { status: "reloaded" as const };
    }

    const liturgy = {
      ...submission.liturgy,
      uid: user.auth.uid,
    };

    await updateLiturgy(liturgyId, liturgy, submission.overwrite);

    toast.add({
      title: "Enregistrement réussi",
      type: "success",
    });
    return { status: "saved" as const };
  } catch (error) {
    if (error instanceof LiturgyConflictError) {
      return { status: "conflict" as const };
    }

    toast.add({
      title: "Echec de l'opération",
      type: "error",
    });

    return { status: "error" as const };
  }
}

export default function EditLiturgy(props: Route.ComponentProps) {
  const {
    params: { liturgyId },
  } = props;

  return <Content key={liturgyId} {...props} />;
}

function Content({ loaderData, params }: Route.ComponentProps) {
  const navigation = useNavigation();
  const fetcher = useFetcher<typeof clientAction>();
  const [lastResult, setLastResult] = useState(fetcher.data);
  const [conflictOpen, setConflictOpen] = useState(false);

  if (fetcher.state === "idle" && fetcher.data?.status !== "error" && fetcher.data !== lastResult) {
    setLastResult(fetcher.data);
    setConflictOpen(fetcher.data?.status === "conflict");
  }
  const conflicted = lastResult?.status === "conflict";

  const { liturgyId } = params;
  const { liturgy, songs, recitations } = loaderData;

  const disabled = navigation.state !== "idle" || fetcher.state !== "idle";

  const form = useForm({
    resolver: valibotResolver(liturgySchema),
    values: liturgy,
    disabled,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isReady },
  } = form;

  useEffect(() => {
    if (fetcher.state !== "idle") return;

    if (fetcher.data?.status === "saved" || fetcher.data?.status === "reloaded") {
      reset(liturgy);
    }
  }, [fetcher.state, fetcher.data, liturgy, reset]);

  const blocker = useBlocker(useCallback(() => isDirty, [isDirty]));

  useBeforeUnload(isDirty);

  const { fields, prepend, insert, remove, update, move } = useFieldArray({
    control,
    name: "blocks",
  });

  const [listElementRef] = useAutoAnimate();

  const date = converToDate(liturgyId);

  function save(data: Liturgy, overwrite = false) {
    return fetcher.submit(
      { intent: "save", liturgy: data, overwrite },
      { method: "post", encType: "application/json" },
    );
  }

  return (
    <>
      <Title>{`Présidence du ${format(date, "do MMMM y")}`}</Title>
      <HeaderSlot>
        <LiturgyHeader
          date={date}
          disabled={disabled || !isDirty}
          loading={fetcher.state !== "idle"}
        />
      </HeaderSlot>
      <FormProvider {...form}>
        <div className="@container flex w-full flex-1 gap-4 px-4 md:px-8">
          <form
            id="liturgy-form"
            className="w-full flex-1 py-4 sm:max-w-xl"
            onSubmit={handleSubmit((data) => save(data))}
          >
            {conflicted && (
              <AlertDialog
                open={conflictOpen}
                onOpenChange={(open) => {
                  if (!disabled) {
                    setConflictOpen(open);
                  }
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>La liturgie a été modifiée</AlertDialogTitle>
                    <AlertDialogDescription>
                      Une autre version a été enregistrée depuis votre ouverture. Votre saisie est
                      conservée et n'a pas été enregistrée.
                      <br />
                      <br />
                      Que souhaitez-vous faire ?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-wrap">
                    <AlertDialogCancel disabled={disabled}>Continuer l'édition</AlertDialogCancel>
                    <ConfirmDropdown>
                      <ConfirmDropdownTrigger
                        render={
                          <Button type="button" variant="outline" disabled={disabled}>
                            Recharger
                          </Button>
                        }
                      />
                      <ConfirmDropdownContent className="max-w-xs text-center">
                        <ConfirmDropdownDescription>
                          Votre saisie sera perdue et remplacée par la dernière version enregistrée.
                        </ConfirmDropdownDescription>
                        <ConfirmDropdownActions>
                          <ConfirmDropdownCancel>Annuler</ConfirmDropdownCancel>
                          <ConfirmDropdownConfirm
                            variant="destructive"
                            disabled={disabled}
                            onClick={() => {
                              void fetcher.submit(
                                { intent: "reload" },
                                { method: "post", encType: "application/json" },
                              );
                            }}
                          >
                            Confirmer
                          </ConfirmDropdownConfirm>
                        </ConfirmDropdownActions>
                      </ConfirmDropdownContent>
                    </ConfirmDropdown>
                    <ConfirmDropdown>
                      <ConfirmDropdownTrigger
                        render={
                          <Button type="button" variant="destructive" disabled={disabled}>
                            Écraser
                          </Button>
                        }
                      />
                      <ConfirmDropdownContent className="max-w-xs text-center">
                        <ConfirmDropdownDescription>
                          La dernière version enregistrée sera remplacée par la votre,
                          souhaitiez-vous confirmer ?
                        </ConfirmDropdownDescription>
                        <ConfirmDropdownActions>
                          <ConfirmDropdownCancel>Annuler</ConfirmDropdownCancel>
                          <ConfirmDropdownConfirm
                            variant="destructive"
                            disabled={disabled}
                            onClick={() => {
                              void handleSubmit((data) => save(data, true))();
                            }}
                          >
                            Confirmer
                          </ConfirmDropdownConfirm>
                        </ConfirmDropdownActions>
                      </ConfirmDropdownContent>
                    </ConfirmDropdown>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AddBlockButton
              onSelect={(type) => {
                prepend(createDefaultBlock(type), { focusName: getBlockFocusName(type, 0) });
              }}
            />

            <div ref={isReady ? listElementRef : null} className="flex flex-col gap-1">
              {fields.map((field, index) => (
                <liturgyBlockContext.Provider
                  key={field.id}
                  value={{
                    remove: () => remove(index),
                    fillFromPreviousWeek: async () => {
                      const previousBlock = await getPreviousWeekBlock(
                        liturgy.blocks,
                        date,
                        field.type,
                        index,
                      );

                      if (previousBlock) {
                        update(index, previousBlock);
                      }
                    },
                  }}
                >
                  {field.type === "section" ? (
                    <SectionBlockForm id={field.id} index={index} />
                  ) : field.type === "announcements" ? (
                    <AnnouncementsBlockForm id={field.id} index={index} />
                  ) : field.type === "openDoors" ? (
                    <OpenDoorsBlockForm id={field.id} index={index} />
                  ) : field.type === "reading" ? (
                    <ReadingBlockForm id={field.id} index={index} />
                  ) : field.type === "recitation" ? (
                    <RecitationBlockForm id={field.id} index={index} recitations={recitations} />
                  ) : field.type === "sermon" ? (
                    <SermonBlockForm id={field.id} index={index} />
                  ) : (
                    <SongsBlockForm id={field.id} index={index} songs={songs} />
                  )}

                  <AddBlockButton
                    onSelect={(type) => {
                      insert(index + 1, createDefaultBlock(type), {
                        focusName: getBlockFocusName(type, index + 1),
                      });
                    }}
                  />
                </liturgyBlockContext.Provider>
              ))}
            </div>
          </form>
          <LiturgyMenu
            fields={fields}
            songs={songs}
            recitations={recitations}
            className="hidden max-w-70 sm:block @min-3xl:max-w-xs"
            onClick={(field) => {
              const blockElement = document.getElementById(field.id);

              if (blockElement) {
                window.scrollTo({
                  top: blockElement.offsetTop,
                  behavior: "smooth",
                });

                blockElement
                  .querySelector<HTMLElement>("input, textarea, select, button")
                  ?.focus({ preventScroll: true });
              }
            }}
            onMove={(fromIndex, toIndex) => {
              move(fromIndex, toIndex);
            }}
          />
        </div>

        <CodeDialog date={date} songs={songs} recitations={recitations} />
      </FormProvider>

      {blocker.state === "blocked" && <DiscardAlertDialog blocker={blocker} />}
    </>
  );
}

interface AddBlockButtonProps {
  onSelect: (type: LiturgyBlockType) => void;
}

function AddBlockButton({ onSelect }: AddBlockButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
      }}
    >
      <PopoverTrigger
        render={
          <AddButton>
            Ajouter un block <PlusIcon />
          </AddButton>
        }
      />
      <PopoverContent
        className="grid w-full grid-cols-3 gap-2 shadow-2xl md:grid-cols-4"
        align="center"
      >
        {liturgyBlockTypes.map((type) => (
          <Button
            key={type}
            type="button"
            className="flex h-auto flex-col items-center justify-center p-3"
            onClick={() => {
              setOpen(false);
              onSelect(type);
            }}
          >
            {renderIcon(type)}
            <span className="text-xs">{liturgyBlockNames[type]}</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function renderIcon(type: LiturgyBlockType) {
  const Icon = liturgyBlockIcons[type];
  return <Icon className="size-6" />;
}
