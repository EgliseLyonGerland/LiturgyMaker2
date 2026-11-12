import Fuse from "fuse.js";
import { ChevronDownIcon, InfoIcon } from "lucide-react";
import { get } from "radashi";
import { useMemo, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import {
  LiturgyCard,
  LiturgyCardContent,
  LiturgyCardHeader,
  LiturgyCardTitle,
} from "@/components/liturgy/liturgy-card";
import { RecitationInformationDrawer } from "@/components/recitation-information-drawer";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { highlightMatches } from "@/lib/fuzy";
import { type RecitationBlock, type Liturgy, type RecitationWithId } from "@/lib/schemas";

interface FieldValues extends Liturgy {
  blocks: RecitationBlock[];
}

interface RecitationBlockFormProps {
  id: string;
  index: number;
  recitations: RecitationWithId[];
}

export function RecitationBlockForm({ id, index, recitations }: RecitationBlockFormProps) {
  const {
    control,
    register,
    formState: { errors, disabled },
  } = useFormContext<FieldValues>();

  const idName = `blocks.${index}.data.id` as const;
  const infosName = `blocks.${index}.data.infos` as const;

  const { field } = useController({ control, name: idName });

  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      recitations.map((recitation) => ({
        id: recitation.id,
        title: recitation.title,
        content: (recitation.content || []).map((line) => line.text).join("\n"),
        recitation,
      })),
    [recitations],
  );

  const selectedItem = items.find((item) => item.id === field.value);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "content"],
        ignoreDiacritics: true,
        includeMatches: true,
        threshold: 0.2,
        distance: Infinity,
      }),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      query.trim()
        ? fuse.search(query).map(({ item, matches }) => ({ ...item, matches }))
        : items.map((item) => ({ ...item, matches: [] })),
    [fuse, items, query],
  );

  return (
    <LiturgyCard id={id} type="recitation" disabled={disabled}>
      <LiturgyCardHeader>
        <LiturgyCardTitle />
      </LiturgyCardHeader>

      <LiturgyCardContent>
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={idName}>Texte</FieldLabel>

              {selectedItem && (
                <Tooltip>
                  <TooltipTrigger
                    delay={500}
                    render={
                      <RecitationInformationDrawer
                        recitation={selectedItem.recitation}
                        trigger={
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            aria-label={`Informations sur la récitation ${selectedItem.title}`}
                            className="self-end"
                          >
                            Informations <InfoIcon />
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent>
                    Afficher le contenu du texte “{selectedItem.title}”
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <Combobox
              items={items}
              filteredItems={filteredItems}
              value={selectedItem}
              onInputValueChange={setQuery}
              onValueChange={(item) => {
                if (item) {
                  const onChange = (value: string) => field.onChange(value);
                  onChange(item.id);
                }
              }}
              autoHighlight
            >
              <ComboboxTrigger
                render={
                  <Button
                    id={idName}
                    variant="outline"
                    className="h-auto justify-between py-2 text-left"
                    aria-invalid={!!get(errors, idName)}
                  >
                    <ComboboxValue placeholder="Choisissez une récitation">
                      {(selectedItem: (typeof items)[number] | null) =>
                        selectedItem ? (
                          <span>{selectedItem.title}</span>
                        ) : (
                          <span className="text-muted-foreground">Choisissez une récitation</span>
                        )
                      }
                    </ComboboxValue>

                    <ChevronDownIcon />
                  </Button>
                }
              />
              <ComboboxContent>
                <ComboboxInput
                  showTrigger={false}
                  placeholder="Rechercher une récitation…"
                  aria-label="Rechercher une récitation"
                />
                <ComboboxEmpty>Auncun texte trouvé</ComboboxEmpty>
                <ComboboxList>
                  {({ matches, ...item }: (typeof filteredItems)[number]) => {
                    const titleMatch = matches?.find((m) => m.key === "title")?.indices ?? [];
                    const contentMatch = matches?.find((m) => m.key === "content")?.indices ?? [];

                    return (
                      <ComboboxItem
                        key={item.id}
                        value={item}
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <span>{highlightMatches(item.title, titleMatch)}</span>
                        {contentMatch.length > 0 && (
                          <div className="my-1 w-full max-w-full rounded border bg-black/5 p-1 text-xs text-muted-foreground/60! italic">
                            {highlightMatches(item.content, contentMatch.slice(0, 1), 50)}
                          </div>
                        )}
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

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
