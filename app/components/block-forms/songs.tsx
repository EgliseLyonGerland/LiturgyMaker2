import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { type Liturgy, type Song, type SongsBlock } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: SongsBlock[];
}

interface SongsBlockFormProps {
  index: number;
  songs: Song[];
}

export function SongsBlockForm({ index, songs }: SongsBlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const { fields, append, remove } = useFieldArray({ control, name: `blocks.${index}.data.items` });

  return (
    <LiturgyCard type="songs">
      <LiturgyCardHeader>
        <LiturgyCardTitle>Chants</LiturgyCardTitle>
      </LiturgyCardHeader>

      {fields.map((field, fieldIndex) => {
        const idName = `blocks.${index}.data.items.${fieldIndex}.id` as const;
        const infosName = `blocks.${index}.data.items.${fieldIndex}.infos` as const;
        const repeatName = `blocks.${index}.data.items.${fieldIndex}.repeat` as const;

        return (
          <Fragment key={field.id}>
            <LiturgyCardSeparator />

            <LiturgyCardContent>
              <FieldSet>
                {fields.length > 1 && (
                  <div className="flex items-center justify-between">
                    <FieldLegend className="m-0">Chant {fieldIndex + 1}</FieldLegend>

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
                  <Controller
                    control={control}
                    name={idName}
                    render={({ field: { name, value, onChange, onBlur } }) => (
                      <Field>
                        <FieldLabel htmlFor={name}>Chant</FieldLabel>
                        <Combobox
                          items={songs}
                          itemToStringLabel={(song) => song.title}
                          value={songs.find((song) => song.id === value)}
                          onValueChange={(song) => {
                            if (song) {
                              onChange(song.id);
                            }
                          }}
                          autoHighlight
                        >
                          <ComboboxInput
                            id={name}
                            name={name}
                            placeholder="Choisissez un chant"
                            className="flex-1"
                            onBlur={onBlur}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>Auncun chant trouvé</ComboboxEmpty>
                            <ComboboxList>
                              {(song: Song) => (
                                <ComboboxItem key={song.id} value={song}>
                                  {song.title} {song.aka && `(${song.aka})`}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </Field>
                    )}
                  />

                  <Field>
                    <FieldLabel htmlFor={infosName}>Infos</FieldLabel>
                    <Textarea
                      id={infosName}
                      {...register(infosName)}
                      className="min-h-lh"
                      aria-invalid={!!get(errors, infosName)}
                    />
                  </Field>

                  <Field orientation="horizontal">
                    <Checkbox id={repeatName} {...register(repeatName)} />
                    <FieldContent>
                      <FieldLabel htmlFor={repeatName}>Chanter deux fois</FieldLabel>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </LiturgyCardContent>
          </Fragment>
        );
      })}

      <LiturgyCardFooter>
        <Button
          variant="outline"
          onClick={() => {
            append({ id: "", infos: "", lyrics: [], repeat: false });
          }}
        >
          Ajouter un chant <PlusIcon />
        </Button>
      </LiturgyCardFooter>
    </LiturgyCard>
  );
}
