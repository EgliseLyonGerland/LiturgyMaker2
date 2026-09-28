import { Popover as PopoverPrimitive } from "@base-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { format } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { CalendarIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { Fragment, type ReactNode } from "react";
import { fr } from "react-day-picker/locale";
import { createPortal } from "react-dom";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  Watch,
  type FieldPath,
} from "react-hook-form";
import { useNavigate, useNavigation } from "react-router";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/reui/autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { liturgyBlockNames, liturgyBlockTypes } from "@/config";
import { books } from "@/config/bible";
import { getPassage, validate } from "@/lib/bibleRef";
import { createDefaultBlock, createDefaultLiturgy } from "@/lib/default-liturgy";
import { firebaseDb } from "@/lib/firebase";
import { converToDate, convertToId } from "@/lib/liturgy-utils";
import migrate from "@/lib/migrate";
import {
  liturgySchema,
  type Liturgy as LiturgyDocument,
  type LiturgyBlockType,
  type SectionBlock,
  type AnnouncementsBlock,
  type OpenDoorsBlock,
  type ReadingBlock,
  type RecitationBlock,
  type SermonBlock,
  type SongsBlock,
} from "@/lib/schemas";

import type { Route } from "./+types/liturgy";

const datePickerHandle = PopoverPrimitive.createHandle();

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { liturgyId } = params;

  const snapshot = await getDoc(doc(firebaseDb, "liturgies", liturgyId));

  if (!snapshot.exists()) {
    return { liturgy: { ...createDefaultLiturgy(liturgyId), id: liturgyId } };
  }

  const data = migrate(snapshot.data()) as LiturgyDocument;

  return { liturgy: { ...data, id: liturgyId } };
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
  const { liturgy } = loaderData;

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
          <div ref={listElement} className="max-w-xl p-4 px-8">
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
                    <SongsBlockForm index={index} />
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
            className="group flex h-6 w-full cursor-pointer items-center px-2 text-sm text-primary-foreground transition-[height] outline-none hover:h-15 hover:delay-300 focus-visible:h-15 aria-expanded:h-15"
          >
            <div className="w-full cursor-pointer rounded-md bg-primary/50 transition-colors group-hover:bg-primary group-hover:delay-50 group-focus-visible:border-ring group-focus-visible:bg-primary group-focus-visible:ring-3 group-focus-visible:ring-ring group-aria-expanded:bg-primary">
              <div className="flex h-0.5 items-center justify-center overflow-hidden transition-[height] group-hover:h-8 group-hover:delay-300 group-focus-visible:h-8 group-aria-expanded:h-8">
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

interface BlockFormProps {
  index: number;
}

interface AnnouncementsBlockFieldValues extends LiturgyDocument {
  blocks: AnnouncementsBlock[];
}

function AnnouncementsBlockForm({ index }: BlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AnnouncementsBlockFieldValues>();
  const { fields } = useFieldArray({ control, name: `blocks.${index}.data.items` });

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Annonces</CardTitle>
      </CardHeader>

      <CardContent>
        {fields.map((field, fieldIndex) => (
          <div key={field.id} className="flex flex-col gap-4">
            {fieldIndex > 0 && <Separator className="my-4" />}

            <Field>
              <FieldLabel htmlFor={`blocks.${index}.data.items.${fieldIndex}.title`}>
                Titre
              </FieldLabel>
              <Input
                id={`blocks.${index}.data.items.${fieldIndex}.title`}
                {...register(`blocks.${index}.data.items.${fieldIndex}.title`)}
                aria-invalid={!!errors.blocks?.[index]?.data?.items?.[fieldIndex]?.title}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`blocks.${index}.data.items.${fieldIndex}.detail`}>
                Détails
              </FieldLabel>
              <Textarea
                id={`blocks.${index}.data.items.${fieldIndex}.detail`}
                {...register(`blocks.${index}.data.items.${fieldIndex}.detail`)}
                aria-invalid={!!errors.blocks?.[index]?.data?.items?.[fieldIndex]?.detail}
              />
            </Field>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SectionBlockFieldValues extends LiturgyDocument {
  blocks: SectionBlock[];
}

function SectionBlockForm({ index }: BlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SectionBlockFieldValues>();

  const path = `blocks.${index}.data.title` as const;

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Section</CardTitle>
      </CardHeader>

      <CardContent>
        <Field>
          <FieldLabel htmlFor={path}>Titre</FieldLabel>
          <Input
            id={path}
            {...register(path)}
            aria-invalid={!!errors.blocks?.[index]?.data?.title}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

interface OpenDoorsBlockFieldValues extends LiturgyDocument {
  blocks: OpenDoorsBlock[];
}

function OpenDoorsBlockForm({ index }: BlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<OpenDoorsBlockFieldValues>();

  const titleName = `blocks.${index}.data.title` as const;
  const detailName = `blocks.${index}.data.detail` as const;
  const prayerTopicsName = `blocks.${index}.data.prayerTopics` as const;

  const { fields, append, remove } = useFieldArray({ control, name: prayerTopicsName });

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Portes Ouvertes</CardTitle>
      </CardHeader>

      <CardContent className="">
        <Field>
          <FieldLabel htmlFor={titleName}>Titre</FieldLabel>
          <Input id={titleName} {...register(titleName)} aria-invalid={!!get(errors, titleName)} />
        </Field>
        <Field>
          <FieldLabel htmlFor={detailName}>Extrait</FieldLabel>
          <Textarea
            id={detailName}
            {...register(detailName)}
            aria-invalid={!!get(errors, detailName)}
          />
        </Field>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>Sujets de prière</FieldLegend>
          <FieldGroup>
            {fields.map((field, fieldIndex) => {
              const fieldName = `blocks.${index}.data.prayerTopics.${fieldIndex}.text` as const;

              return (
                <Field key={field.id}>
                  <FieldLabel htmlFor={fieldName}>Sujet {fieldIndex + 1}</FieldLabel>
                  <div className="flex gap-2">
                    <Textarea
                      id={fieldName}
                      {...register(fieldName)}
                      className="min-h-lh"
                      aria-invalid={!!get(errors, fieldName)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={fields.length <= 1}
                      onClick={() => {
                        remove(fieldIndex);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </Field>
              );
            })}

            {fields.length < 3 && (
              <Button
                onClick={() => {
                  append({ text: "" });
                }}
              >
                Ajouter un sujet
              </Button>
            )}
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

function isSimilar(value: string, prefix: string) {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });

  const str1 = value.replace(/\s+/, "");
  const str2 = prefix.replace(/\s+/, "");

  return collator.compare(str1.slice(0, [...str2].length), str2) === 0;
}

interface ReadingBlockFieldValues extends LiturgyDocument {
  blocks: ReadingBlock[];
}

function ReadingBlockForm({ index }: BlockFormProps) {
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ReadingBlockFieldValues>();

  const { fields } = useFieldArray({ control, name: `blocks.${index}.data.bibleRefs` });

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>
          Lecture{" "}
          <span className="ml-1 text-sm text-muted-foreground">
            <Watch
              control={control}
              name={`blocks.${index}.title`}
              render={(title) => title && `(${title})`}
            />
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {fields.map((field, fieldIndex) => (
          <Fragment key={field.id}>
            <Field>
              <FieldLabel htmlFor={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}>
                Référence
              </FieldLabel>
              <Autocomplete
                items={books}
                autoHighlight
                filter={(item, query) => isSimilar(item.name, query)}
              >
                <Controller
                  control={control}
                  name={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}
                  render={({ field }) => <AutocompleteInput {...field} />}
                />
                <AutocompleteContent className="data-empty:hidden">
                  <AutocompleteList>
                    {(item: (typeof books)[number]) => (
                      <AutocompleteItem key={item.name} value={`${item.alt || item.name} `}>
                        {item.alt || item.name}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              </Autocomplete>
            </Field>
            <Field>
              <FieldLabel htmlFor={`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`}>
                Extrait
              </FieldLabel>
              <Textarea
                id={`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`}
                {...register(`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`)}
                aria-invalid={!!errors.blocks?.[index]?.data?.bibleRefs?.[fieldIndex]?.excerpt}
              />
            </Field>
            <Watch
              control={control}
              name={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}
              render={(id) => {
                const valid = validate(id);

                return (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <div className="self-start">
                          <Button
                            variant="ghost"
                            disabled={!valid}
                            onClick={async () => {
                              const result = await getPassage(
                                getValues(`blocks.${index}.data.bibleRefs.${fieldIndex}.id`),
                              );

                              if (result) {
                                setValue(
                                  `blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`,
                                  result,
                                );
                              }
                            }}
                          >
                            Remplir automatiquement
                          </Button>
                        </div>
                      }
                    />
                    {!valid && (
                      <TooltipContent>
                        <div>
                          Pour utiliser le remplissage automatique, vous devez saisir une référence
                          valide.
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              }}
            />
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

interface RecitationBlockFieldValues extends LiturgyDocument {
  blocks: RecitationBlock[];
}

function RecitationBlockForm({ index }: BlockFormProps) {
  const { control } = useFormContext<RecitationBlockFieldValues>();

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Récitation</CardTitle>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  );
}

interface SermonBlockFieldValues extends LiturgyDocument {
  blocks: SermonBlock[];
}

function SermonBlockForm({ index }: BlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SermonBlockFieldValues>();

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Prédication</CardTitle>
      </CardHeader>

      <CardContent>
        <Field>
          <FieldLabel htmlFor={`blocks.${index}.data.title`}>Titre</FieldLabel>
          <Input
            id={`blocks.${index}.data.title`}
            {...register(`blocks.${index}.data.title`)}
            aria-invalid={!!errors.blocks?.[index]?.data?.title}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`blocks.${index}.data.author`}>Auteur</FieldLabel>
          <Input
            id={`blocks.${index}.data.author`}
            {...register(`blocks.${index}.data.author`)}
            aria-invalid={!!errors.blocks?.[index]?.data?.title}
          />
        </Field>

        <SermonPlanField index={index} />
      </CardContent>
    </Card>
  );
}

function SermonPlanField({ index }: BlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SermonBlockFieldValues>();

  const name: FieldPath<SermonBlockFieldValues> = `blocks.${index}.data.plan`;

  const { fields } = useFieldArray({ control, name });

  return (
    <Field>
      <FieldLabel htmlFor={`${name}.0`}>Plan</FieldLabel>

      {fields.map((field, index) => (
        <Input
          key={field.id}
          id={`${name}.${index}`}
          {...register(`${name}.${index}`)}
          aria-invalid={!!errors.blocks?.[index]?.data?.title}
        />
      ))}
    </Field>
  );
}

interface SongsBlockFieldValues extends LiturgyDocument {
  blocks: SongsBlock[];
}

function SongsBlockForm({ index }: BlockFormProps) {
  const { control } = useFormContext<SongsBlockFieldValues>();

  return (
    <Card className="transition-[outline] focus-within:ring-primary/80">
      <CardHeader>
        <CardTitle>Chants</CardTitle>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  );
}
