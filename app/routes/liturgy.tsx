import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format, subDays } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useBlocker, useFetcher, useNavigation } from "react-router";
import * as v from "valibot";

import { AddButton } from "@/components/add-button";
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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { liturgyBlockIcons, liturgyBlockNames, liturgyBlockTypes } from "@/config";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { getLiturgy, getRecitations, getSongs, updateLiturgy } from "@/lib/api";
import { createDefaultBlock } from "@/lib/default-liturgy";
import { firebaseAuth } from "@/lib/firebase";
import { liturgyBlockContext } from "@/lib/liturgy-context";
import { getBlockFocusName } from "@/lib/liturgy-form-utils";
import { converToDate, convertToId } from "@/lib/liturgy-utils";
import { liturgySchema, type Liturgy, type LiturgyBlockType } from "@/lib/schemas";

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

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const { liturgyId } = params;
  const data = await request.json();

  try {
    const output = v.parse(liturgySchema, data);

    const liturgy = {
      ...output,
      uid: firebaseAuth.currentUser?.uid || "",
    };

    await updateLiturgy(liturgyId, liturgy);

    toast.add({
      title: "Enregistrement réussi",
      type: "success",
    });
  } catch (error) {
    console.log(error);
    toast.add({
      title: "Echec de l'enregistrement",
      type: "error",
    });
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
  const fetcher = useFetcher();

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
    formState: { isDirty, isReady },
  } = form;

  const blocker = useBlocker(useCallback(() => isDirty, [isDirty]));

  useBeforeUnload(isDirty);

  const { fields, prepend, insert, remove, update, move } = useFieldArray({
    control,
    name: "blocks",
  });

  const [listElementRef] = useAutoAnimate();

  const date = converToDate(liturgyId);

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
            onSubmit={handleSubmit((data) =>
              fetcher.submit(data, {
                method: "post",
                encType: "application/json",
              }),
            )}
          >
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
