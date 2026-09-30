import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { MenuIcon, PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
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
        <PointsField index={index} />
      </LiturgyCardContent>
    </LiturgyCard>
  );
}

function BibleRefsField({ index }: SermonBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.bibleRefs`;

  const { fields, append, remove, swap } = useFieldArray({ control, name });

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

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;

          const { source } = event.operation;

          if (isSortable(source)) {
            const { initialIndex, index } = source;

            swap(initialIndex, index);
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
      <div className="flex gap-1">
        <Button ref={handleRef} variant="ghost" size="icon" disabled={actionsDisabled}>
          <MenuIcon />
        </Button>
        <BibleRefField control={control} name={name} />
        <Button size="icon" variant="ghost" disabled={actionsDisabled} onClick={onRemove}>
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}

function PointsField({ index }: SermonBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.plan`;

  const { fields, append, remove, swap } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend variant="label" className="m-0">
          Points
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

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;

          const { source } = event.operation;

          if (isSortable(source)) {
            const { initialIndex, index } = source;

            swap(initialIndex, index);
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
      <div className="flex gap-1">
        <Button ref={handleRef} variant="ghost" size="icon" disabled={actionsDisabled}>
          <MenuIcon />
        </Button>
        <Input
          id={name}
          {...register(name)}
          className="min-h-lh"
          aria-invalid={!!get(errors, name)}
        />
        <Button size="icon" variant="ghost" disabled={actionsDisabled} onClick={onRemove}>
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}
