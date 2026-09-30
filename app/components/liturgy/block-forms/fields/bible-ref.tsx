import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/reui/autocomplete";
import { books } from "@/config/bible";

function isSimilar(value: string, prefix: string) {
  const collator = new Intl.Collator("fr", { sensitivity: "base" });

  const str1 = value.replace(/\s+/, "");
  const str2 = prefix.replace(/\s+/, "");

  return collator.compare(str1.slice(0, [...str2].length), str2) === 0;
}

interface BibleRefFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues, any, TFieldValues>;
  name: FieldPath<TFieldValues>;
}

export function BibleRefField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
}: BibleRefFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Autocomplete
          items={books}
          autoHighlight
          filter={(item, query) => isSimilar(item.name, query)}
          onValueChange={(value) => {
            field.onChange(value);
          }}
        >
          <AutocompleteInput {...field} />
          <AutocompleteContent className="data-empty:hidden">
            <AutocompleteList>
              {(item: (typeof books)[number]) => (
                <AutocompleteItem key={item.name} value={`${item.alt || item.name} `}>
                  {item.alt || item.name}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
      )}
    />
  );
}
