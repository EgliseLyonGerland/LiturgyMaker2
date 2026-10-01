import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type AnnouncementsBlock, type Liturgy } from "@/lib/schemas";

import { SortableButton } from "../sortable-button";

interface FieldValues extends Liturgy {
  blocks: AnnouncementsBlock[];
}

interface AnnouncementsBlockFormProps {
  index: number;
}

export function AnnouncementsBlockForm({ index }: AnnouncementsBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `blocks.${index}.data.items`,
  });

  return (
    <LiturgyCard type="announcements">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

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
        <LiturgyCardContent className="flex flex-col gap-8">
          {fields.map((field, fieldIndex) => (
            <AnnouncementsBlockFormItem
              key={field.id}
              id={field.id}
              index={fieldIndex}
              name={`blocks.${index}.data.items.${fieldIndex}`}
              onRemove={() => {
                remove(fieldIndex);
              }}
              sortable={fields.length > 1}
            />
          ))}
        </LiturgyCardContent>
      </DragDropProvider>

      <LiturgyCardFooter>
        <Button
          type="button"
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

interface AnnouncementsBlockFormItemProps {
  id: string;
  index: number;
  name: `blocks.${number}.data.items.${number}`;
  actionsDisabled?: boolean;
  sortable?: boolean;
  onRemove: () => void;
}

function AnnouncementsBlockFormItem({
  id,
  index,
  name,
  sortable,
  onRemove,
}: AnnouncementsBlockFormItemProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  const titleName = `${name}.title` as const;
  const detailName = `${name}.detail` as const;

  return (
    <div ref={ref} className="group">
      <FieldSet>
        <div className={cn("items-center gap-2", sortable ? "flex" : "hidden")}>
          <SortableButton ref={handleRef} />

          <FieldLegend variant="label" className="m-0 mr-auto opacity-60">
            Annonce {index + 1}
          </FieldLegend>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100"
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
        </div>

        <div className="flex">
          {sortable && <div className="mr-4 ml-2 w-px bg-border" />}

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
              <FieldLabel htmlFor={detailName}>Détails</FieldLabel>
              <Textarea
                id={detailName}
                {...register(detailName)}
                aria-invalid={!!get(errors, detailName)}
              />
            </Field>
          </FieldGroup>
        </div>
      </FieldSet>
    </div>
  );
}
