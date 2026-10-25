import { get } from "radashi";
import { useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Liturgy, type SectionBlock } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: SectionBlock[];
}

interface SectionBlockFormProps {
  id: string;
  index: number;
}

export function SectionBlockForm({ id, index }: SectionBlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const name = `blocks.${index}.data.title` as const;

  return (
    <LiturgyCard id={id} type="section">
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

      <LiturgyCardContent>
        <Field>
          <FieldLabel htmlFor={name}>Titre</FieldLabel>
          <Input id={name} {...register(name)} aria-invalid={!!get(errors, name)} />
        </Field>
      </LiturgyCardContent>
    </LiturgyCard>
  );
}
