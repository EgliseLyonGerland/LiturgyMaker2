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
import { type SermonBlock, type Liturgy } from "@/lib/schemas";

import { SortableButton } from "../sortable-button";
import { BibleRefField } from "./fields/bible-ref";

interface FieldValues extends Liturgy {
  blocks: SermonBlock[];
}

interface SermonBlockFormProps {
  id: string;
  index: number;
}

export function SermonBlockForm({ id, index }: SermonBlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const titleName = `blocks.${index}.data.title` as const;
  const authorName = `blocks.${index}.data.author` as const;

  return (
    <LiturgyCard id={id} type="sermon">
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
              <FieldLabel htmlFor={authorName}>Auteur</FieldLabel>
              <Input
                id={authorName}
                {...register(authorName)}
                aria-invalid={!!get(errors, authorName)}
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
        <PointsField index={index} />
      </LiturgyCardContent>
    </LiturgyCard>
  );
}

function BibleRefsField({ index }: SermonBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.bibleRefs`;

  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend variant="label" className="m-0">
          Références bibliques
        </FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            append({ id: "" });
          }}
        >
          Ajouter une réf <PlusIcon />
        </Button>
      </div>

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
            <BibleRefsFieldItem
              key={field.id}
              id={field.id}
              index={fieldIndex}
              name={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}
              actionsDisabled={fields.length <= 1}
              onRemove={() => {
                remove(fieldIndex);
              }}
            />
          ))}
        </FieldGroup>
      </DragDropProvider>
    </FieldSet>
  );
}

interface BibleRefsFieldItemProps {
  id: string;
  index: number;
  name: FieldPath<FieldValues>;
  actionsDisabled?: boolean;
  onRemove: () => void;
}

function BibleRefsFieldItem({
  id,
  index,
  name,
  actionsDisabled,
  onRemove,
}: BibleRefsFieldItemProps) {
  const { control } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  return (
    <Field ref={ref}>
      <div className="flex gap-2">
        <SortableButton ref={handleRef} disabled={actionsDisabled} />
        <BibleRefField control={control} name={name} />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={actionsDisabled}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}

function PointsField({ index }: SermonBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.plan`;

  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend variant="label" className="m-0">
          Points
        </FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            append({ text: "" });
          }}
        >
          Ajouter un point <PlusIcon />
        </Button>
      </div>

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
            <PointsFieldItem
              key={field.id}
              id={field.id}
              index={fieldIndex}
              name={`blocks.${index}.data.plan.${fieldIndex}.text`}
              actionsDisabled={fields.length <= 1}
              onRemove={() => {
                remove(fieldIndex);
              }}
            />
          ))}
        </FieldGroup>
      </DragDropProvider>
    </FieldSet>
  );
}

interface PointsFieldItemProps {
  id: string;
  index: number;
  name: FieldPath<FieldValues>;
  actionsDisabled?: boolean;
  onRemove: () => void;
}

function PointsFieldItem({ id, index, name, actionsDisabled, onRemove }: PointsFieldItemProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  return (
    <Field ref={ref}>
      <div className="flex gap-2">
        <SortableButton ref={handleRef} disabled={actionsDisabled} />
        <Input
          id={name}
          {...register(name)}
          className="min-h-lh"
          aria-invalid={!!get(errors, name)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={actionsDisabled}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}
