import { FieldError } from "@/components/ui/field";

interface FieldErrorProps {
  errors: [string, ...string[]] | null;
  isEdited: boolean;
  isSubmitted: boolean;
}

export function FormishFieldError({ errors, isEdited, isSubmitted }: FieldErrorProps) {
  if (!errors || (!isEdited && !isSubmitted)) {
    return null;
  }

  return <FieldError>{errors[0]}</FieldError>;
}
