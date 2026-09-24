import * as formisch from "@formisch/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { doc, getDoc } from "firebase/firestore";
import { PlusCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  type FieldPath,
} from "react-hook-form";

import { FormishFieldError } from "@/components/formisch-field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { liturgyBlockNames, liturgyBlockTypes } from "@/config";
import { createDefaultBlock, createDefaultLiturgy } from "@/lib/default-liturgy";
import { firebaseDb } from "@/lib/firebase";
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

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { liturgyId } = params;

  const snapshot = await getDoc(doc(firebaseDb, "liturgies", liturgyId));

  if (!snapshot.exists()) {
    return { liturgy: createDefaultLiturgy(liturgyId) };
  }

  const data = migrate(snapshot.data()) as LiturgyDocument;

  return { liturgy: data };
}

export default function Liturgy({ loaderData }: Route.ComponentProps) {
  const { liturgy } = loaderData;

  const form = useForm({
    resolver: valibotResolver(liturgySchema),
    defaultValues: liturgy,
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const fieldArray = useFieldArray({ control, name: "blocks" });

  const [listElement] = useAutoAnimate();

  console.log(liturgy);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit((data) => {
          console.log(data);
        })}
      >
        <HeaderSlot>Hello, World!</HeaderSlot>

        <div ref={listElement} className="max-w-xl p-4 px-8">
          <AddBlockButton
            onSelect={(type) => {
              fieldArray.prepend(createDefaultBlock(type));
            }}
          />

          <div ref={listElement} className="flex flex-col">
            {fieldArray.fields.map((field, index) => (
              <>
                {field.type === "section" ? (
                  <SectionBlockForm key={field.id} index={index} />
                ) : field.type === "announcements" ? (
                  <AnnouncementsBlockForm key={field.id} index={index} />
                ) : field.type === "openDoors" ? (
                  <OpenDoorsBlockForm key={field.id} index={index} />
                ) : field.type === "reading" ? (
                  <ReadingBlockForm key={field.id} index={index} />
                ) : field.type === "recitation" ? (
                  <RecitationBlockForm key={field.id} index={index} />
                ) : field.type === "sermon" ? (
                  <SermonBlockForm key={field.id} index={index} />
                ) : (
                  <SongsBlockForm key={field.id} index={index} />
                )}

                <AddBlockButton
                  onSelect={(type) => {
                    fieldArray.insert(index + 1, createDefaultBlock(type));
                  }}
                />
              </>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={!isDirty}>
          Enregistrer
        </Button>
      </form>
    </FormProvider>
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
            className="group text-muted-foreground flex h-5 w-full cursor-pointer items-center px-2 text-sm transition-[height] outline-none hover:h-15 hover:delay-300 focus-visible:h-15 aria-expanded:h-15"
          >
            <div className="bg-muted/50 group-hover:bg-muted group-aria-expanded:bg-muted group-focus-visible:bg-muted group-focus-visible:border-ring group-focus-visible:ring-ring w-full cursor-pointer rounded-md transition-colors group-hover:delay-50 group-focus-visible:ring-3">
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
    <Card className="focus-within:ring-primary transition-[outline]">
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
                className="field-sizing-content"
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
    <Card className="focus-within:ring-primary transition-[outline]">
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
  const { control } = useFormContext<OpenDoorsBlockFieldValues>();

  return (
    <Card className="focus-within:ring-primary transition-[outline]">
      <CardHeader>
        <CardTitle>Portes Ouvertes</CardTitle>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  );
}

interface ReadingBlockFieldValues extends LiturgyDocument {
  blocks: ReadingBlock[];
}

function ReadingBlockForm({ index }: BlockFormProps) {
  const { control } = useFormContext<ReadingBlockFieldValues>();

  return (
    <Card className="focus-within:ring-primary transition-[outline]">
      <CardHeader>
        <CardTitle>Lecture</CardTitle>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  );
}

interface RecitationBlockFieldValues extends LiturgyDocument {
  blocks: RecitationBlock[];
}

function RecitationBlockForm({ index }: BlockFormProps) {
  const { control } = useFormContext<RecitationBlockFieldValues>();

  return (
    <Card className="focus-within:ring-primary transition-[outline]">
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
    <Card className="focus-within:ring-primary transition-[outline]">
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

  const path: FieldPath<SermonBlockFieldValues> = `blocks.${index}.data.plan`;

  const { fields } = useFieldArray({ control, path });

  return (
    <Field>
      <FieldLabel htmlFor={`${path}.0`}>Plan</FieldLabel>

      {fields.map((field, index) => (
        <Input
          key={field.id}
          id={`${path}.${index}`}
          {...register(`${path}.${index}`)}
          // aria-invalid={!!errors.blocks?.[index]?.data?.title}
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
    <Card className="focus-within:ring-primary transition-[outline]">
      <CardHeader>
        <CardTitle>Chants</CardTitle>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  );
}
