import { useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardSeparator,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Liturgy, type SectionBlock } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: SectionBlock[];
}

interface SectionBlockFormProps {
  index: number;
}

export function SectionBlockForm({ index }: SectionBlockFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();

  const path = `blocks.${index}.data.title` as const;

  return (
    <LiturgyCard type="section">
      <LiturgyCardHeader>
        <LiturgyCardTitle>Section</LiturgyCardTitle>
      </LiturgyCardHeader>

      <LiturgyCardSeparator />

      <LiturgyCardContent>
        <Field>
          <FieldLabel htmlFor={path}>Titre</FieldLabel>
          <Input
            id={path}
            {...register(path)}
            aria-invalid={!!errors.blocks?.[index]?.data?.title}
          />
        </Field>
      </LiturgyCardContent>
    </LiturgyCard>
  );
}
