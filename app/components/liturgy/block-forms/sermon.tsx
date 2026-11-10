import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
import { useFieldArray, useFormContext, Watch, type FieldPath } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SermonBlock, type Liturgy } from "@/lib/schemas";

import { SortableButton } from "../sortable-button";
import { BibleRefField } from "./fields/bible-ref";
import { ImagePreview } from "./fields/image-preview";

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
    formState: { errors, disabled },
  } = useFormContext<FieldValues>();

  const titleName = `blocks.${index}.data.title` as const;
  const authorName = `blocks.${index}.data.author` as const;

  return (
    <LiturgyCard id={id} type="sermon" disabled={disabled}>
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
        <ImageField index={index} />
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

function ImageField({ index }: { index: number }) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const imageName = `blocks.${index}.data.image` as const;

  return (
    <>
      <Field>
        <FieldLabel htmlFor={imageName}>
          Image <Badge size="sm">Optionnel</Badge>
        </FieldLabel>
        <FieldDescription id={`${imageName}-description`}>
          Fournissez l’URL d’une image libre de droits pour illustrer la prédication (par exemple
          sur{" "}
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
            Unsplash
          </a>
          ).
        </FieldDescription>
        <Input
          id={imageName}
          type="url"
          {...register(imageName)}
          aria-describedby={`${imageName}-description`}
          aria-invalid={!!get(errors, imageName)}
        />
        <FieldError errors={[get(errors, imageName)]} />
      </Field>

      <Watch
        control={control}
        name={imageName}
        render={(value) => <ImagePreview key={value?.trim()} url={value?.trim() ?? ""} />}
      />
    </>
  );
}

interface BibleRefsFieldProps {
  index: number;
}

function BibleRefsField({ index }: BibleRefsFieldProps) {
  const {
    control,
    formState: { disabled },
  } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.bibleRefs`;

  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <FieldLegend variant="label" className="mb-4">
        Références bibliques
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => {
          append({ id: "" });
        }}
      >
        Ajouter une réf <PlusIcon />
      </Button>
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
  const {
    control,
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
          aria-label={`Déplacer la référence ${index + 1}`}
        />
        <BibleRefField
          control={control}
          name={name}
          aria-label={`Référence biblique ${index + 1}`}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Supprimer la référence ${index + 1}`}
          disabled={actionsDisabled || disabled}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
      <FieldError id={`${name}-error`} errors={[get(errors, name)]} />
    </Field>
  );
}

interface PointsFieldProps {
  index: number;
}

function PointsField({ index }: PointsFieldProps) {
  const {
    control,
    formState: { disabled },
  } = useFormContext<FieldValues>();

  const name: FieldPath<FieldValues> = `blocks.${index}.data.plan`;

  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <FieldSet>
      <FieldLegend variant="label" className="mb-4">
        Points
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => {
          append({ text: "" });
        }}
      >
        Ajouter un point <PlusIcon />
      </Button>
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
          aria-label={`Déplacer le point ${index + 1}`}
        />
        <Input
          id={name}
          aria-label={`Point ${index + 1} de la prédication`}
          {...register(name)}
          className="min-h-lh"
          aria-invalid={!!get(errors, name)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Supprimer le point ${index + 1}`}
          disabled={actionsDisabled || disabled}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      </div>
    </Field>
  );
}
