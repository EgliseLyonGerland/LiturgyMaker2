import { useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy-card";
import { Separator } from "@/components/ui/separator";
import { type RecitationBlock, type Liturgy } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: RecitationBlock[];
}

interface RecitationBlockFormProps {
  index: number;
}

export function RecitationBlockForm({ index }: RecitationBlockFormProps) {
  const { control } = useFormContext<FieldValues>();

  return (
    <LiturgyCard type="recitation">
      <LiturgyCardHeader>
        <LiturgyCardTitle>Récitation</LiturgyCardTitle>
      </LiturgyCardHeader>
      <Separator />

      <LiturgyCardContent></LiturgyCardContent>
    </LiturgyCard>
  );
}
