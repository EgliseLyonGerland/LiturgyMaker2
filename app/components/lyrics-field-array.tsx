import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import type { Lens } from "@hookform/lenses";
import { EllipsisVerticalIcon, GripHorizontalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Controller, useController, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Lyrics, RecitationContent } from "@/lib/schemas";

export type PassageFieldArrayProps =
  | { kind: "song"; lens: Lens<Lyrics> }
  | { kind: "recitation"; lens: Lens<RecitationContent> };

export function PassageFieldArray(props: PassageFieldArrayProps) {
  return props.kind === "song" ? (
    <LyricsFieldArray lens={props.lens} />
  ) : (
    <ContentFieldArray lens={props.lens} />
  );
}

interface LyricsFieldArrayProps {
  lens: Lens<Lyrics>;
}

function LyricsFieldArray({ lens }: LyricsFieldArrayProps) {
  const { fields, append, move, insert, remove } = useFieldArray(lens.interop());

  return (
    <PassageList onMove={move} onAppend={() => append({ type: "verse", text: "" })}>
      {lens.map(fields, (field, fieldLens, index) => (
        <PassageItem
          key={field.id}
          id={field.id}
          index={index}
          textLens={fieldLens.focus("text")}
          typeLens={fieldLens.focus("type")}
          onInsertBefore={() => insert(index, { type: "verse", text: "" })}
          onInsertAfter={() => insert(index + 1, { type: "verse", text: "" })}
          onRemove={() => remove(index)}
        />
      ))}
    </PassageList>
  );
}

function ContentFieldArray({ lens }: { lens: Lens<RecitationContent> }) {
  const { fields, append, move, insert, remove } = useFieldArray(lens.interop());

  return (
    <PassageList onMove={move} onAppend={() => append({ text: "" })}>
      {lens.map(fields, (field, fieldLens, index) => (
        <PassageItem
          key={field.id}
          id={field.id}
          index={index}
          textLens={fieldLens.focus("text")}
          onInsertBefore={() => insert(index, { text: "" })}
          onInsertAfter={() => insert(index + 1, { text: "" })}
          onRemove={() => remove(index)}
        />
      ))}
    </PassageList>
  );
}

interface PassageListProps {
  children: ReactNode;
  onMove: (from: number, to: number) => void;
  onAppend: () => void;
}

function PassageList({ children, onMove, onAppend }: PassageListProps) {
  return (
    <div className="space-y-4">
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;

          const { source } = event.operation;

          if (isSortable(source)) {
            const { initialIndex, index } = source;

            onMove(initialIndex, index);
          }
        }}
      >
        <div className="flex flex-col gap-4">{children}</div>
      </DragDropProvider>

      <Button type="button" className="w-full" variant="outline" onClick={onAppend}>
        Ajouter un passage <PlusIcon />
      </Button>
    </div>
  );
}

interface PassageItemProps {
  textLens: Lens<string>;
  typeLens?: Lens<Lyrics[number]["type"]>;
  id: string;
  index: number;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onRemove: () => void;
}

function PassageItem({
  textLens,
  typeLens,
  id,
  index,
  onInsertBefore,
  onInsertAfter,
  onRemove,
}: PassageItemProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const { ref, isDragging } = useSortable({ id, index, handle: handleRef });

  const {
    field,
    fieldState: { error },
  } = useController(textLens.interop());

  return (
    <div ref={ref}>
      <Field>
        <InputGroup className="p-1 dark:has-data-[type=chorus]:bg-blue-950/20">
          <InputGroupTextarea
            {...field}
            className="dark:bg-transparent"
            placeholder="Saisir le texte du passage"
            aria-invalid={!!error}
          />

          <InputGroupAddon
            align="block-start"
            className="grid cursor-default grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-md p-1 dark:bg-black/30"
            data-dragging={isDragging || undefined}
          >
            {typeLens ? (
              <Controller
                {...typeLens.interop()}
                render={({ field }) => (
                  <div className="ml-2 flex items-center gap-3" data-type={field.value}>
                    <Switch
                      id={`passage.${id}.type`}
                      size="sm"
                      checked={field.value === "chorus"}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? "chorus" : "verse");
                      }}
                    />
                    <Label htmlFor={`passage.${id}.type`}>Refrain</Label>
                  </div>
                )}
              />
            ) : (
              <div />
            )}

            <div ref={handleRef} className="flex cursor-grab px-4">
              <GripHorizontalIcon className="size-4" />
            </div>

            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="ghost" size="icon">
                      <EllipsisVerticalIcon />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-auto" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={onInsertBefore}>
                      <PlusIcon /> Ajouter au dessus
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onInsertAfter}>
                      <PlusIcon />
                      Ajouter en dessous
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={onRemove}>
                      <TrashIcon />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </InputGroupAddon>
        </InputGroup>
        <FieldError errors={[error]} />
      </Field>
    </div>
  );
}
