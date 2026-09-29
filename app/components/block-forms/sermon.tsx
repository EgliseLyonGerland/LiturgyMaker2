import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useFieldArray, useFormContext, type FieldPath } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SermonBlock, type Liturgy } from "@/lib/schemas";

import { BibleRefField } from "./fields/bible-ref";

interface FieldValues extends Liturgy {
  blocks: SermonBlock[];
}

interface SermonBlockFormProps {
  index: number;
}

export function SermonBlockForm({ index }: SermonBlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  return (
    <LiturgyCard type="sermon">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <FieldSet>
          <FieldGroup>
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
          </FieldGroup>
        </FieldSet>
      </LiturgyCardContent>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <BibleRefsField index={index} />
      </LiturgyCardContent>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <PlanField index={index} />
      </LiturgyCardContent>
    </LiturgyCard>
  );
}

function BibleRefsField({ index }: SermonBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.bibleRefs`;

  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend variant="label" className="m-0">
          Références bibliques
        </FieldLegend>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            append({ id: "" });
          }}
        >
          Ajouter une réf <PlusIcon />
        </Button>
      </div>
      <FieldGroup className="gap-4">
        {fields.map((field, fieldIndex) => {
          const fieldName = `blocks.${index}.data.bibleRefs.${fieldIndex}.id` as const;

          return (
            <Field key={field.id}>
              <div className="flex gap-2">
                <BibleRefField control={control} name={fieldName} />
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
      </FieldGroup>
    </FieldSet>
  );
}

function PlanField({ index }: SermonBlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.plan`;

  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend variant="label" className="m-0">
          Plan
        </FieldLegend>
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            append({ text: "" });
          }}
        >
          Ajouter un point <PlusIcon />
        </Button>
      </div>
      <FieldGroup className="gap-4">
        {fields.map((field, fieldIndex) => {
          const fieldName = `blocks.${index}.data.plan.${fieldIndex}.text` as const;

          return (
            <Field key={field.id}>
              <div className="flex gap-2">
                <Input
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
      </FieldGroup>
    </FieldSet>
  );
}
