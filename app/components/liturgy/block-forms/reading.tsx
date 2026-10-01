import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
import { useFieldArray, useFormContext, Watch } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPassage, validate } from "@/lib/bible";
import { type ReadingBlock, type Liturgy } from "@/lib/schemas";

import { SortableButton } from "../sortable-button";
import { BibleRefField } from "./fields/bible-ref";

interface FieldValues extends Liturgy {
  blocks: ReadingBlock[];
}

interface ReadingBlockFormProps {
  index: number;
}

export function ReadingBlockForm({ index }: ReadingBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `blocks.${index}.data.bibleRefs`,
  });

  return (
    <LiturgyCard type="reading">
      <LiturgyCardHeader>
        <LiturgyCardTitle>
          <span className="text-xs text-muted-foreground">
            <Watch control={control} name={`blocks.${index}.title`} render={(title) => title} />
          </span>
        </LiturgyCardTitle>
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
            <ReadingBlockFormItem
              key={field.id}
              id={field.id}
              index={fieldIndex}
              name={`blocks.${index}.data.bibleRefs.${fieldIndex}`}
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
            append({ id: "", excerpt: "" });
          }}
        >
          Ajouter une réf <PlusIcon />
        </Button>
      </LiturgyCardFooter>
    </LiturgyCard>
  );
}

interface ReadingBlockFormItemProps {
  id: string;
  index: number;
  name: `blocks.${number}.data.bibleRefs.${number}`;
  actionsDisabled?: boolean;
  sortable?: boolean;
  onRemove: () => void;
}

function ReadingBlockFormItem({ id, index, name, sortable, onRemove }: ReadingBlockFormItemProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  const idName = `${name}.id` as const;
  const excerptName = `${name}.excerpt` as const;

  return (
    <div ref={ref}>
      <FieldSet>
        <div className={cn("items-center gap-2", sortable ? "flex" : "hidden")}>
          <SortableButton ref={handleRef} />

          <FieldLegend variant="label" className="m-0 mr-auto opacity-60">
            Référence {index + 1}
          </FieldLegend>

          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <TrashIcon />
          </Button>
        </div>

        <div className="flex">
          {sortable && <div className="mr-4 ml-2 w-px bg-border" />}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={idName}>Référence</FieldLabel>
              <BibleRefField control={control} name={idName} />
            </Field>
            <Field>
              <FieldLabel htmlFor={excerptName}>Extrait</FieldLabel>
              <Textarea
                id={excerptName}
                {...register(excerptName)}
                aria-invalid={!!get(errors, excerptName)}
              />
              <Watch
                control={control}
                name={idName}
                render={(id) => {
                  const valid = validate(id);

                  return (
                    <Tooltip disabled={valid}>
                      <TooltipTrigger
                        render={
                          <div className="w-auto! self-start">
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              disabled={!valid}
                              onClick={async () => {
                                const result = await getPassage(id);

                                if (result) {
                                  setValue(excerptName, result);
                                }
                              }}
                            >
                              Remplir automatiquement
                            </Button>
                          </div>
                        }
                      />
                      <TooltipContent>
                        <div>
                          Pour utiliser le remplissage automatique, vous devez saisir une référence
                          valide.
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }}
              />
            </Field>
          </FieldGroup>
        </div>
      </FieldSet>
    </div>
  );
}
