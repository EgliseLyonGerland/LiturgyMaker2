import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Lens } from "@hookform/lenses";
import { cn } from "cn";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisVerticalIcon,
  GripHorizontalIcon,
  GripVerticalIcon,
  PlusIcon,
  SquareSplitVerticalIcon,
  TrashIcon,
} from "lucide-react";
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

import { AddAboveIcon } from "./icons/add-above-icon";
import { AddBelowIcon } from "./icons/add-below-icon";
import { ButtonGroup } from "./ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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

  const handleSplit = (index: number) => {
    const text = fields[index].text;
    const middle = Math.floor(text.length / 2);
    const firstHalf = text.slice(0, middle);
    const secondHalf = text.slice(middle);
    remove(index);
    insert(index, { type: "verse", text: secondHalf });
    insert(index, { type: "verse", text: firstHalf });
  };

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
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onSplit={() => handleSplit(index)}
          onRemove={() => remove(index)}
        />
      ))}
    </PassageList>
  );
}

function ContentFieldArray({ lens }: { lens: Lens<RecitationContent> }) {
  const { fields, append, move, insert, remove } = useFieldArray(lens.interop());

  const handleSplit = (index: number) => {
    const text = fields[index].text;
    const middle = Math.floor(text.length / 2);
    const firstHalf = text.slice(0, middle);
    const secondHalf = text.slice(middle);
    remove(index);
    insert(index, { text: secondHalf });
    insert(index, { text: firstHalf });
  };

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
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onSplit={() => handleSplit(index)}
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

      <Button type="button" className="w-full" variant="secondary" onClick={onAppend}>
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
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSplit: () => void;
  onRemove: () => void;
}

function PassageItem({
  textLens,
  typeLens,
  id,
  index,
  onInsertBefore,
  onInsertAfter,
  onMoveUp,
  onMoveDown,
  onSplit,
  onRemove,
}: PassageItemProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id, index, handle: handleRef });

  const {
    field,
    fieldState: { error },
  } = useController(textLens.interop());

  return (
    <Field ref={ref} className="group/expandable-toolbar">
      <InputGroup className="border-taupe-500 p-1 has-data-[type=chorus]:border-blue-500">
        <InputGroupTextarea
          {...field}
          className="bg-transparent"
          placeholder="Saisir le texte du passage"
          aria-label={`Texte du passage ${index + 1}`}
          aria-invalid={!!error}
          aria-describedby={error ? `passage.${id}.error` : undefined}
        />

        {/* <InputGroupAddon
            align="block-start"
            className="grid h-9 cursor-default grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-md bg-muted p-1 dark:bg-muted"
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
                      aria-label={`Refrain pour le passage ${index + 1}`}
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

            <button
              type="button"
              ref={handleRef}
              aria-label={`Déplacer le passage ${index + 1}`}
              className="flex cursor-grab px-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <GripHorizontalIcon className="size-4" />
            </button>
          </InputGroupAddon> */}

        {/* <InputGroupAddon
            align="block-end"
            className="flex justify-center border-t border-muted-foreground/20"
          >
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" onClick={onInsertBefore}>
                        <AddAboveIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Ajouter un passage au dessus</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" onClick={onInsertAfter}>
                        <AddBelowIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Ajouter un passage en dessous</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" onClick={onMoveUp}>
                        <ArrowUpIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Déplacer le passage au dessus</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" onClick={onMoveDown}>
                        <ArrowDownIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Déplacer le passage en dessous</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" onClick={onSplit}>
                        <SquareSplitVerticalIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Diviser le passage en deux</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="destructive" size="icon-sm" onClick={onRemove}>
                        <TrashIcon />
                      </Button>
                    }
                  />
                  <TooltipContent pointerEventsNone>Supprimer le passage</TooltipContent>
                </Tooltip>
          </InputGroupAddon> */}

        <InputGroupAddon align="block-end" className="h-11">
          {typeLens ? (
            <Controller
              {...typeLens.interop()}
              render={({ field }) => (
                <div
                  className="ml-2 flex cursor-default items-center gap-3"
                  data-type={field.value}
                >
                  <Switch
                    id={`passage.${id}.type`}
                    size="sm"
                    aria-label={`Refrain pour le passage ${index + 1}`}
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

          <div
            className={cn(
              "group/expandable-toolbar",
              "rounded-full",
              "ring",
              "ring-1",
              // "px-2",
              "overflow-hidden",
              "grid",
              "place-content-center",
              "min-w-10",
              "min-h-2.5",
              "grid-rows-[0.1fr]",
              "grid-cols-[0.1fr]",
              "group-hover/expandable-toolbar:grid-rows-[1fr]",
              "group-hover/expandable-toolbar:grid-cols-[1fr]",
              "group-hover/expandable-toolbar:bottom-3",
              "group-hover/expandable-toolbar:rounded-md",
              "bg-input/30",
              "group-hover/expandable-toolbar:bg-background",
              "transition-all",
              "duration-200",
              "ease-in-out",
              "absolute",
              "bottom-5",
              "left-1/2",
              "translate-x-[-50%]",
            )}
          >
            <div
              className={cn(
                "flex",
                "min-h-0",
                "min-w-0",
                "scale-[0.25]",
                "items-center",
                "justify-center",
                "transition-all",
                "duration-300",
                "ease-in-out",
                "group-hover/expandable-toolbar:scale-100",
                "group-hover/expandable-toolbar:duration-150",
              )}
            >
              <div
                className={cn(
                  "scale-[0.25]",
                  "opacity-0",
                  "transition-all",
                  "duration-150",
                  "ease-out",
                  "group-hover/expandable-toolbar:scale-100",
                  "group-hover/expandable-toolbar:opacity-100",
                  "group-hover/expandable-toolbar:delay-100",
                  "first:origin-right",
                  "last:origin-left",
                )}
              >
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    ref={handleRef}
                    aria-label={`Déplacer le passage ${index + 1}`}
                    className="mr-2 cursor-grab"
                  >
                    <GripVerticalIcon />
                  </Button>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onInsertBefore}>
                          <AddAboveIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>Ajouter un passage au dessus</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onInsertAfter}>
                          <AddBelowIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>Ajouter un passage en dessous</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onMoveUp}>
                          <ArrowUpIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>Déplacer le passage au dessus</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onMoveDown}>
                          <ArrowDownIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>
                      Déplacer le passage en dessous
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onSplit}>
                          <SquareSplitVerticalIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>Diviser le passage en deux</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={onRemove}>
                          <TrashIcon />
                        </Button>
                      }
                    />
                    <TooltipContent pointerEventsNone>Supprimer le passage</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id={`passage.${id}.error`} errors={[error]} />
    </Field>
  );
}
