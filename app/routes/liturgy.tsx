import { Popover as PopoverPrimitive } from "@base-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { addDays, format, subDays } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SaveIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { fr } from "react-day-picker/locale";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useBlocker, useFetcher, useNavigate, useNavigation } from "react-router";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
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

const datePickerHandle = PopoverPrimitive.createHandle();

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

  const liturgy = await getLiturgy(liturgyId);
  const songs = await getSongs();
  const recitations = await getRecitations();

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
  } catch {
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
  const navigate = useNavigate();
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

  const { fields, prepend, insert, remove, update } = useFieldArray({ control, name: "blocks" });

  const [listElement] = useAutoAnimate();

  const date = converToDate(liturgyId);
  const previousDate = subDays(date, 7);
  const nextDate = addDays(date, 7);

  return (
    <>
      <HeaderSlot>
        <div className="flex items-center">
          <Button
            size="icon-sm"
            variant="ghost"
            title={`Aller à la la liturgie du ${format(previousDate, "do MMMM y")}`}
            onClick={() => {
              navigate(`/liturgies/${convertToId(previousDate)}`);
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Popover handle={datePickerHandle}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="group"
                  disabled={disabled}
                  title="Sélectionner une date"
                >
                  <span>
                    <span className="hidden md:inline">Présidence du</span>{" "}
                    {format(date, "do MMMM y")}
                  </span>
                </Button>
              }
            />
            <PopoverContent className="p-0" align="start">
              <Calendar
                className="w-full min-w-(--anchror-width)"
                mode="single"
                locale={fr}
                selected={date}
                defaultMonth={date}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    datePickerHandle.close();
                    navigate(`/liturgies/${convertToId(selectedDate)}`);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            size="icon-sm"
            variant="ghost"
            title={`Aller à la la liturgie du ${format(nextDate, "do MMMM y")}`}
            onClick={() => {
              navigate(`/liturgies/${convertToId(nextDate)}`);
            }}
          >
            <ChevronRightIcon />
          </Button>

          <Button
            className="ml-auto"
            type="submit"
            form="liturgy-form"
            disabled={disabled || !isDirty}
          >
            {fetcher.state !== "idle" && <Spinner />}
            <span className="hidden md:block">Enregistrer</span>
            <SaveIcon className="md:hidden" />
          </Button>
        </div>
      </HeaderSlot>
      <FormProvider {...form}>
        <form
          id="liturgy-form"
          onSubmit={handleSubmit((data) =>
            fetcher.submit(data, {
              method: "post",
              encType: "application/json",
            }),
          )}
        >
          <div className="max-w-xl p-4 px-4 md:px-8">
            <AddBlockButton
              onSelect={(type) => {
                prepend(createDefaultBlock(type), { focusName: getBlockFocusName(type, 0) });
              }}
            />

            <div ref={isReady ? listElement : null} className="flex flex-col gap-1">
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
                    <SectionBlockForm index={index} />
                  ) : field.type === "announcements" ? (
                    <AnnouncementsBlockForm index={index} />
                  ) : field.type === "openDoors" ? (
                    <OpenDoorsBlockForm index={index} />
                  ) : field.type === "reading" ? (
                    <ReadingBlockForm index={index} />
                  ) : field.type === "recitation" ? (
                    <RecitationBlockForm index={index} recitations={recitations} />
                  ) : field.type === "sermon" ? (
                    <SermonBlockForm index={index} />
                  ) : (
                    <SongsBlockForm index={index} songs={songs} />
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
          </div>
        </form>
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
        className="grid w-(--anchor-width) grid-cols-3 gap-2 shadow-2xl md:grid-cols-4"
        align="center"
        sideOffset={-2}
      >
        {liturgyBlockTypes.map((type) => (
          <Button
            key={type}
            type="button"

            className="flex h-auto flex-col items-center justify-center py-3"
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
