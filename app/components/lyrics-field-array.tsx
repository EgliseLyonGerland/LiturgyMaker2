import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Lens } from "@hookform/lenses";
import { clsx } from "clsx";
import { EllipsisVerticalIcon, GripHorizontalIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useFieldArray } from "react-hook-form";

import type { Lyrics } from "@/lib/schemas";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "./ui/input-group";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export interface LyricsFieldArrayProps {
  lens: Lens<Lyrics>;
}

export function LyricsFieldArray({ lens }: LyricsFieldArrayProps) {
  const fieldArray = useFieldArray(lens.interop());

  const { fields, append, move, insert, remove } = fieldArray;

  const [listElement] = useAutoAnimate();

  return (
    <div className="space-y-4">
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;

          const { source } = event.operation;

          if (isSortable(source)) {
            const { initialIndex, index } = source;

            move(initialIndex, index);
          }
        }}
      >
        <div ref={listElement} className="flex flex-col gap-4">
          {lens.map(fields, (field, fieldLens, index) => (
            <LyricsItem
              key={field.id}
              lens={fieldLens}
              id={field.id}
              index={index}
              onInsertBefore={() => insert(index, { type: "verse", text: "" })}
              onInsertAfter={() => insert(index + 1, { type: "verse", text: "" })}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      </DragDropProvider>

      <Button
        type="button"
        className="w-full"
        variant="outline"
        onClick={() => {
          append({ type: "verse", text: "" });
        }}
      >
        Ajouter un passage <PlusIcon />
      </Button>
    </div>
  );
}

interface LyricsItemProps {
  lens: Lens<Lyrics[number]>;
  id: string;
  index: number;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onRemove: () => void;
}

function LyricsItem({ lens, id, index, onInsertBefore, onInsertAfter, onRemove }: LyricsItemProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const { ref, isDragging } = useSortable({ id, index, handle: handleRef });

  return (
    <div ref={ref}>
      <Field>
        <InputGroup className="dark:has-data-[type=chorus]:bg-blue-950/20">
          <InputGroupTextarea
            {...lens.focus("text").interop((control, name) => control.register(name))}
            className="dark:bg-transparent"
            placeholder="Saisir le texte du passage"
          />

          <InputGroupAddon
            align="block-start"
            className={clsx(
              "group grid cursor-default grid-cols-[1fr_auto_1fr] items-center gap-4 dark:bg-transparent",
            )}
            data-dragging={isDragging || undefined}
          >
            <Controller
              {...lens.focus("type").interop()}

              render={({ field }) => (
                <div className="ml-2 flex items-center gap-3" data-type={field.value}>
                  <Switch
                    id={`lyrics.${index}.type`}
                    size="sm"
                    checked={field.value === "chorus"}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? "chorus" : "verse");
                    }}
                  />
                  <Label htmlFor={`lyrics.${index}.type`}>Refrain</Label>
                </div>
              )}
            />

            <div
              ref={handleRef}
              className="mt-1 flex cursor-grab self-start px-4 opacity-0 transition-opacity group-hover:opacity-100 group-data-dragging:opacity-100"
            >
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
      </Field>
    </div>
  );
}
