import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
import { useFieldArray, useFormContext, type FieldPath } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { maxPrayerTopics } from "@/config";
import { type Liturgy, type OpenDoorsBlock } from "@/lib/schemas";

import { SortableButton } from "../sortable-button";

interface FieldValues extends Liturgy {
  blocks: OpenDoorsBlock[];
}

interface OpenDoorsBlockFormProps {
  id: string;
  index: number;
}

export function OpenDoorsBlockForm({ id, index }: OpenDoorsBlockFormProps) {
  const {
    control,
    register,
    formState: { errors, disabled },
  } = useFormContext<FieldValues>();

  const titleName = `blocks.${index}.data.title` as const;
  const detailName = `blocks.${index}.data.detail` as const;
  const prayerTopicsName = `blocks.${index}.data.prayerTopics` as const;

  const { fields, append, remove, move } = useFieldArray({ control, name: prayerTopicsName });

  return (
    <LiturgyCard id={id} type="openDoors" disabled={disabled}>
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

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
          <FieldLegend variant="label" className="mb-4">
            Sujets de prière
          </FieldLegend>

          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return;

              const { source } = event.operation;

              if (isSortable(source)) {
                const { initialIndex, index } = source;

                move(initialIndex, index);
              }
            }}
          >
            <FieldGroup className="gap-4">
              {fields.map((field, fieldIndex) => (
                <PrayerTopicsFieldItem
                  key={field.id}
                  id={field.id}
                  index={fieldIndex}
                  name={`blocks.${index}.data.prayerTopics.${fieldIndex}.text`}
                  actionsDisabled={fields.length <= 1}
                  onRemove={() => {
                    remove(fieldIndex);
                  }}
                />
              ))}
            </FieldGroup>
          </DragDropProvider>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={fields.length >= maxPrayerTopics || disabled}
            onClick={() => {
              append({ text: "" });
            }}
          >
            Ajouter un sujet <PlusIcon />
          </Button>
        </FieldSet>
      </LiturgyCardContent>
    </LiturgyCard>
  );
}

interface PrayerTopicsFieldItemProps {
  id: string;
  index: number;
  name: FieldPath<FieldValues>;
  actionsDisabled?: boolean;
  onRemove: () => void;
}

function PrayerTopicsFieldItem({
  id,
  index,
  name,
  actionsDisabled,
  onRemove,
}: PrayerTopicsFieldItemProps) {
  const {
    register,
    formState: { errors, disabled },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  return (
    <Field ref={ref}>
      <div className="flex gap-2">
        <SortableButton
          ref={handleRef}
          disabled={actionsDisabled || disabled}
          aria-label={`Déplacer le sujet de prière ${index + 1}`}
        />
        <Textarea
          id={name}
          aria-label={`Sujet de prière ${index + 1}`}
          {...register(name)}
          className="min-h-lh"
          aria-invalid={!!get(errors, name)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Supprimer le sujet de prière ${index + 1}`}
          disabled={actionsDisabled || disabled}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}
