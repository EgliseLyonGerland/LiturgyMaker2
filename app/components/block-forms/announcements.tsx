import { PlusIcon } from "lucide-react";
import { Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type AnnouncementsBlock, type Liturgy } from "@/lib/schemas";

import { Button } from "../ui/button";

interface FieldValues extends Liturgy {
  blocks: AnnouncementsBlock[];
}

interface AnnouncementsBlockFormProps {
  index: number;
}

export function AnnouncementsBlockForm({ index }: AnnouncementsBlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const { fields, append } = useFieldArray({ control, name: `blocks.${index}.data.items` });

  return (
    <LiturgyCard type="announcements">
      <LiturgyCardHeader>
        <LiturgyCardTitle>Annonces</LiturgyCardTitle>
      </LiturgyCardHeader>

      {fields.map((field, fieldIndex) => (
        <Fragment key={field.id}>
          <LiturgyCardSeparator />

          <LiturgyCardContent key={field.id}>
            <FieldSet>
              <FieldGroup>
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
              </FieldGroup>
            </FieldSet>
          </LiturgyCardContent>
        </Fragment>
      ))}

      <LiturgyCardFooter>
        <Button
          variant="outline"
          onClick={() => {
            append({ title: "", detail: "" });
          }}
        >
          Ajouter une annonce <PlusIcon />
        </Button>
      </LiturgyCardFooter>
    </LiturgyCard>
  );
}
