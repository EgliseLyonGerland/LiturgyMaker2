import type { FieldValues, FormState } from "react-hook-form";

import { FieldError } from "@/components/ui/field";

interface FormFieldErrorProps<T extends FieldValues> {
  formState: FormState<T>;
  name: keyof T;
}

export function FormFieldError<T extends FieldValues>({ formState, name }: FormFieldErrorProps<T>) {
  const { errors, isSubmitted, touchedFields } = formState;
  const isEdited = Object.keys(touchedFields).length > 0;

  if (!errors || (!isEdited && !isSubmitted)) {
    return null;
  }

  const error = errors[name];
  const message = error?.message;

  if (typeof message !== "string") {
    return null;
  }

  return <FieldError>{message}</FieldError>;
}
