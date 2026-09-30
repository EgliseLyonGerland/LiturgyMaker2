import { get } from "radashi";
import { Controller, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Separator } from "@/components/ui/separator";
import { type RecitationBlock, type Liturgy, type Recitation } from "@/lib/schemas";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

interface FieldValues extends Liturgy {
  blocks: RecitationBlock[];
}

interface RecitationBlockFormProps {
  index: number;
  recitations: Recitation[];
}

export function RecitationBlockForm({ index, recitations }: RecitationBlockFormProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const idName = `blocks.${index}.data.id` as const;
  const infosName = `blocks.${index}.data.infos` as const;

  return (
    <LiturgyCard type="recitation">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>
      <Separator />

      <LiturgyCardContent>
        <FieldGroup>
          <Controller
            control={control}
            name={idName}
            render={({ field: { name, value, onChange, onBlur } }) => (
              <Field>
                <FieldLabel htmlFor={name}>Texte</FieldLabel>
                <Combobox
                  items={recitations}
                  itemToStringLabel={(recitation) => recitation.title}
                  value={recitations.find((recitation) => recitation.id === value)}
                  onValueChange={(recitation) => {
                    if (recitation) {
                      onChange(recitation.id);
                    }
                  }}
                  autoHighlight
                >
                  <ComboboxInput
                    id={name}
                    name={name}
                    placeholder="Choisissez un texte"
                    className="flex-1"
                    onBlur={onBlur}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Auncun texte trouvé</ComboboxEmpty>
                    <ComboboxList>
                      {(recitation: Recitation) => (
                        <ComboboxItem key={recitation.id} value={recitation}>
                          {recitation.title}
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
        </FieldGroup>
      </LiturgyCardContent>
    </LiturgyCard>
  );
}
