import { PlusIcon, TrashIcon } from "lucide-react";
import { Fragment } from "react";
import { useFieldArray, useFormContext, Watch } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPassage, validate } from "@/lib/bible";
import { type ReadingBlock, type Liturgy } from "@/lib/schemas";

import { BibleRefField } from "./fields/bible-ref";

interface FieldValues extends Liturgy {
  blocks: ReadingBlock[];
}

interface ReadingBlockFormProps {
  index: number;
}

export function ReadingBlockForm({ index }: ReadingBlockFormProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `blocks.${index}.data.bibleRefs`,
  });

  return (
    <LiturgyCard type="reading">
      <LiturgyCardHeader>
        <LiturgyCardTitle>
          Lecture{" "}
          <span className="ml-1 text-sm text-muted-foreground">
            <Watch
              control={control}
              name={`blocks.${index}.title`}
              render={(title) => title && `(${title})`}
            />
          </span>
        </LiturgyCardTitle>
      </LiturgyCardHeader>

      {fields.map((field, fieldIndex) => (
        <Fragment key={field.id}>
          <LiturgyCardSeparator />

          <LiturgyCardContent>
            <FieldSet>
              {fields.length > 1 && (
                <div className="flex items-center justify-between">
                  <FieldLegend className="m-0">Passage {fieldIndex + 1}</FieldLegend>

                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={fields.length < 2}
                    onClick={() => {
                      remove(fieldIndex);
                    }}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}>
                    Référence
                  </FieldLabel>

                  <BibleRefField
                    control={control}
                    name={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`}>
                    Extrait
                  </FieldLabel>
                  <Textarea
                    id={`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`}
                    {...register(`blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`)}
                    aria-invalid={!!errors.blocks?.[index]?.data?.bibleRefs?.[fieldIndex]?.excerpt}
                  />
                  <Watch
                    control={control}
                    name={`blocks.${index}.data.bibleRefs.${fieldIndex}.id`}
                    render={(id) => {
                      const valid = validate(id);

                      return (
                        <Tooltip disabled={valid}>
                          <TooltipTrigger
                            render={
                              <div className="self-start">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  disabled={!valid}
                                  onClick={async () => {
                                    const result = await getPassage(id);

                                    if (result) {
                                      setValue(
                                        `blocks.${index}.data.bibleRefs.${fieldIndex}.excerpt`,
                                        result,
                                      );
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
                              Pour utiliser le remplissage automatique, vous devez saisir une
                              référence valide.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }}
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
            append({ id: "", excerpt: "" });
          }}
        >
          Ajouter une réf <PlusIcon />
        </Button>
      </LiturgyCardFooter>
    </LiturgyCard>
  );
}
