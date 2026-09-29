import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useFieldArray, useFormContext } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { type Liturgy, type OpenDoorsBlock } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: OpenDoorsBlock[];
}

interface OpenDoorsBlockFormProps {
  index: number;
}

export function OpenDoorsBlockForm({ index }: OpenDoorsBlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const titleName = `blocks.${index}.data.title` as const;
  const detailName = `blocks.${index}.data.detail` as const;
  const prayerTopicsName = `blocks.${index}.data.prayerTopics` as const;

  const { fields, append, remove } = useFieldArray({ control, name: prayerTopicsName });

  return (
    <LiturgyCard type="openDoors">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={titleName}>Titre</FieldLabel>
              <Input
                id={titleName}
                {...register(titleName)}
                aria-invalid={!!get(errors, titleName)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={detailName}>Extrait</FieldLabel>
              <Textarea
                id={detailName}
                {...register(detailName)}
                aria-invalid={!!get(errors, detailName)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </LiturgyCardContent>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <FieldSet>
          <div className="flex items-center justify-between">
            <FieldLegend variant="label" className="m-0">
              Sujets de prière
            </FieldLegend>
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                append({ text: "" });
              }}
            >
              Ajouter un sujet <PlusIcon />
            </Button>
          </div>
          <FieldGroup className="gap-4">
            {fields.map((field, fieldIndex) => {
              const fieldName = `blocks.${index}.data.prayerTopics.${fieldIndex}.text` as const;

              return (
                <Field key={field.id}>
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
          </FieldGroup>
        </FieldSet>
      </LiturgyCardContent>
    </LiturgyCard>
  );
}
