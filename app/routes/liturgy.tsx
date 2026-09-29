import { Popover as PopoverPrimitive } from "@base-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format } from "date-fns";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { CalendarIcon, PlusCircleIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { fr } from "react-day-picker/locale";
import { createPortal } from "react-dom";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useNavigation } from "react-router";

import { AnnouncementsBlockForm } from "@/components/block-forms/announcements";
import { OpenDoorsBlockForm } from "@/components/block-forms/open-doors";
import { ReadingBlockForm } from "@/components/block-forms/reading";
import { RecitationBlockForm } from "@/components/block-forms/recitation";
import { SectionBlockForm } from "@/components/block-forms/section";
import { SermonBlockForm } from "@/components/block-forms/sermon";
import { SongsBlockForm } from "@/components/block-forms/songs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { liturgyBlockNames, liturgyBlockTypes } from "@/config";
import { createDefaultBlock, createDefaultLiturgy } from "@/lib/default-liturgy";
import { firebaseDb } from "@/lib/firebase";
import { converToDate, convertToId } from "@/lib/liturgy-utils";
import migrate from "@/lib/migrate";
import { queryClient } from "@/lib/query-client";
import {
  liturgySchema,
  type Liturgy as LiturgyDocument,
  type LiturgyBlockType,
  type Song as SongDocument,
} from "@/lib/schemas";

import type { Route } from "./+types/liturgy";

const datePickerHandle = PopoverPrimitive.createHandle();

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { liturgyId } = params;

  const liturgy = await queryClient.query({
    queryKey: ["liturgies", liturgyId],
    queryFn: async () => {
      const snapshot = await getDoc(doc(firebaseDb, "liturgies", liturgyId));

      if (!snapshot.exists()) {
        return { id: liturgyId, ...createDefaultLiturgy() };
      }

      const data = migrate(snapshot.data()) as LiturgyDocument;

      return { id: liturgyId, ...data };
    },
  });

  const songs = await queryClient.query({
    queryKey: ["songs"],
    queryFn: async () => {
      const { docs } = await getDocs(query(collection(firebaseDb, "songs")));

      return docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SongDocument);
    },
  });

  return { liturgy, songs };
}

export default function Liturgy(props: Route.ComponentProps) {
  const { loaderData } = props;
  const { liturgy } = loaderData;

  return <Content key={liturgy.id} {...props} />;
}

function Content({ loaderData, params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();

  const { liturgyId } = params;
  const { liturgy, songs } = loaderData;

  const form = useForm({
    resolver: valibotResolver(liturgySchema),
    defaultValues: liturgy,
    disabled: navigation.state !== "idle",
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const fieldArray = useFieldArray({ control, name: "blocks" });

  const [listElement] = useAutoAnimate();

  const date = converToDate(liturgyId);

  return (
    <>
      <HeaderSlot>
        <div className="flex items-center">
          <div className="mr-2">Présidence du {format(date, "do MMMM y")}</div>

          <Popover handle={datePickerHandle}>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon">
                  <CalendarIcon />
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
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

          <Button className="ml-auto" type="submit" form="liturgy-form" disabled={!isDirty}>
            Enregistrer
          </Button>
        </div>
      </HeaderSlot>
      <FormProvider {...form}>
        <form
          id="liturgy-form"
          onSubmit={handleSubmit((data) => {
            console.log(data);
          })}
        >
          <div ref={listElement} className="max-w-xl p-4 px-4 md:px-8">
            <AddBlockButton
              onSelect={(type) => {
                fieldArray.prepend(createDefaultBlock(type));
              }}
            />

            <div ref={listElement} className="flex flex-col gap-1">
              {fieldArray.fields.map((field, index) => (
                <Fragment key={field.id}>
                  {field.type === "section" ? (
                    <SectionBlockForm index={index} />
                  ) : field.type === "announcements" ? (
                    <AnnouncementsBlockForm index={index} />
                  ) : field.type === "openDoors" ? (
                    <OpenDoorsBlockForm index={index} />
                  ) : field.type === "reading" ? (
                    <ReadingBlockForm index={index} />
                  ) : field.type === "recitation" ? (
                    <RecitationBlockForm index={index} />
                  ) : field.type === "sermon" ? (
                    <SermonBlockForm index={index} />
                  ) : (
                    <SongsBlockForm index={index} songs={songs} />
                  )}

                  <AddBlockButton
                    onSelect={(type) => {
                      fieldArray.insert(index + 1, createDefaultBlock(type));
                    }}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </form>
      </FormProvider>
    </>
  );
}

interface HeaderSlotProps {
  children: ReactNode;
}

function HeaderSlot({ children }: HeaderSlotProps) {
  const element = document.getElementById("header");

  return element ? createPortal(children, element) : null;
}

interface AddBlockButtonProps {
  onSelect: (type: LiturgyBlockType) => void;
}

function AddBlockButton({ onSelect }: AddBlockButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="group flex h-6 w-full cursor-pointer items-center text-sm text-background transition-[height] outline-none hover:h-15 hover:delay-300 focus-visible:h-15 aria-expanded:h-15"
          >
            <div className="w-full cursor-pointer rounded-md bg-border transition-colors group-hover:bg-foreground group-hover:delay-50 group-focus-visible:border-ring group-focus-visible:bg-foreground group-focus-visible:ring-3 group-focus-visible:ring-ring group-aria-expanded:bg-foreground/80">
              <div className="flex h-px items-center justify-center overflow-hidden transition-[height] group-hover:h-8 group-hover:delay-300 group-focus-visible:h-8 group-aria-expanded:h-8">
                <span className="inline-flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-300 group-focus-visible:opacity-100 group-aria-expanded:opacity-100">
                  <PlusCircleIcon className="size-4" /> Ajouter un block
                </span>
              </div>
            </div>
          </button>
        }
      />
      <DropdownMenuContent className="w-40" align="center">
        {liturgyBlockTypes.map((type) => (
          <DropdownMenuItem
            key={type}
            onClick={() => {
              onSelect(type);
            }}
          >
            {liturgyBlockNames[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
