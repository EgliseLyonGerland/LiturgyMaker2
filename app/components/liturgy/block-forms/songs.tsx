import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { clsx } from "clsx";
import { PlusIcon, TrashIcon } from "lucide-react";
import { get } from "radashi";
import { useRef } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
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

import { SortableButton } from "../sortable-button";

interface FieldValues extends Liturgy {
  blocks: SongsBlock[];
}

interface SongsBlockFormProps {
  index: number;
  songs: Song[];
}

export function SongsBlockForm({ index, songs }: SongsBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: `blocks.${index}.data.items`,
  });

  return (
    <LiturgyCard type="songs">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

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
        <LiturgyCardContent className="flex flex-col gap-8">
          {fields.map((field, fieldIndex) => (
            <SongsBlockFormItem
              key={field.id}
              id={field.id}
              index={fieldIndex}
              name={`blocks.${index}.data.items.${fieldIndex}`}
              songs={songs}
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

interface SongsBlockFormItemProps {
  id: string;
  index: number;
  name: `blocks.${number}.data.items.${number}`;
  songs: Song[];
  actionsDisabled?: boolean;
  sortable?: boolean;
  onRemove: () => void;
}

function SongsBlockFormItem({
  id,
  index,
  name,
  songs,
  sortable,
  onRemove,
}: SongsBlockFormItemProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  const idName = `${name}.id` as const;
  const infosName = `${name}.infos` as const;
  const repeatName = `${name}.repeat` as const;

  return (
    <div ref={ref}>
      <FieldSet>
        <div className={clsx("items-center gap-2", sortable ? "flex" : "hidden")}>
          <SortableButton ref={handleRef} />

          <FieldLegend variant="label" className="m-0 mr-auto opacity-60">
            Chant {index + 1}
          </FieldLegend>

          <Button size="icon" variant="ghost" onClick={onRemove}>
            <TrashIcon />
          </Button>
        </div>

        <div className="flex">
          {sortable && <div className="mr-4 ml-2 w-px bg-border" />}

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
        </div>
      </FieldSet>
    </div>
  );
}
