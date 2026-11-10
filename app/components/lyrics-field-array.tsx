import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import type { Lens } from "@hookform/lenses";
import { cn } from "cn";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  PlusIcon,
  SquareSplitVerticalIcon,
  TrashIcon,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { Controller, useController, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Lyrics, RecitationContent } from "@/lib/schemas";

import { AddButton } from "./add-button";
import { AddAboveIcon } from "./icons/add-above-icon";
import { AddBelowIcon } from "./icons/add-below-icon";
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
          onPaste={(texts) => {
            if (texts.length > 0) {
              insert(
                index + 1,
                texts.map((text) => ({ type: "verse", text })),
                { shouldFocus: false },
              );
            }
          }}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onInsertAbove={() => insert(index, { type: "verse", text: "" })}
          onInsertBelow={() => insert(index + 1, { type: "verse", text: "" })}
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
          onPaste={(texts) => {
            if (texts.length > 0) {
              insert(
                index + 1,
                texts.map((text) => ({ text })),
                { shouldFocus: false },
              );
            }
          }}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onInsertAbove={() => insert(index, { text: "" })}
          onInsertBelow={() => insert(index + 1, { text: "" })}
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
        {children}
      </DragDropProvider>

      <AddButton onClick={onAppend}>
        Ajouter un passage <PlusIcon />
      </AddButton>
    </div>
  );
}

interface PassageItemProps {
  textLens: Lens<string>;
  typeLens?: Lens<Lyrics[number]["type"]>;
  id: string;
  index: number;
  onPaste: (texts: string[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onSplit: () => void;
  onRemove: () => void;
}

function PassageItem({
  textLens,
  typeLens,
  id,
  index,
  onPaste,
  onMoveUp,
  onMoveDown,
  onInsertAbove,
  onInsertBelow,
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
    <Field ref={ref}>
      <InputGroup className="border-taupe-500 p-1 has-data-[type=chorus]:border-blue-500">
        <InputGroupTextarea
          {...field}
          className="bg-transparent"
          placeholder="Saisir le texte du passage"
          aria-label={`Texte du passage ${index + 1}`}
          aria-invalid={!!error}
          aria-describedby={error ? `passage.${id}.error` : undefined}
          onPaste={(event) => {
            event.preventDefault();

            const textarea = event.currentTarget;
            const { value, selectionStart, selectionEnd } = textarea;
            const pastedText = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");

            const splitText = pastedText.split(/\n{2,}/);
            const [firstText, ...restText] = splitText;
            const cursorPosition = selectionStart + splitText[0].length;

            field.onChange(value.slice(0, selectionStart) + firstText + value.slice(selectionEnd));

            onPaste(restText);

            requestAnimationFrame(() => {
              if (document.activeElement === textarea) {
                textarea.setSelectionRange(cursorPosition, cursorPosition);
              }
            });
          }}
        />

        {typeLens && (
          <InputGroupAddon align="block-start" className="h-11">
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
          </InputGroupAddon>
        )}
        <InputGroupAddon align="block-end" className="group/toolbar-wrapper h-11">
          <div
            className={cn(
              "group/toolbar grid min-h-2.5 min-w-10 place-content-center overflow-hidden rounded-full ring",
              "absolute bottom-5 left-1/2 translate-x-[-50%] transition-all duration-200 ease-in-out",
              "grid-cols-[0.1fr] grid-rows-[0.1fr] bg-input/30",

              "group-hover/toolbar-wrapper:grid-rows-[1fr]",
              "group-hover/toolbar-wrapper:grid-cols-[1fr]",
              "group-hover/toolbar-wrapper:bottom-3.5",
              "group-hover/toolbar-wrapper:rounded-md",
              "group-hover/toolbar-wrapper:bg-background/80",

              "has-focus-visible:grid-rows-[1fr]",
              "has-focus-visible:grid-cols-[1fr]",
              "has-focus-visible:bottom-3.5",
              "has-focus-visible:rounded-md",
              "has-focus-visible:bg-background/80",

              "pointer-coarse:grid-rows-[1fr]",
              "pointer-coarse:grid-cols-[1fr]",
              "pointer-coarse:bottom-3.5",
              "pointer-coarse:rounded-md",
              "pointer-coarse:bg-background/80",

              "group-has-focus-visible:grid-rows-[1fr]",
              "group-has-focus-visible:grid-cols-[1fr]",
              "group-has-focus-visible:bottom-3.5",
              "group-has-focus-visible:rounded-md",
              "group-has-focus-visible:bg-background/80",

              "pointer-coarse:grid-rows-[1fr]",
              "pointer-coarse:grid-cols-[1fr]",
              "pointer-coarse:bottom-3.5",
              "pointer-coarse:rounded-md",
              "pointer-coarse:bg-background/80",
            )}
          >
            <div
              className={cn(
                "flex min-h-0 min-w-0 items-center justify-center transition-all ease-in-out",
                "scale-[0.25] duration-300",

                "group-hover/toolbar-wrapper:scale-100",
                "group-hover/toolbar-wrapper:duration-150",

                "group-has-focus-visible/toolbar:scale-100",
                "group-has-focus-visible/toolbar:duration-150",

                "pointer-coarse:scale-100",
                "pointer-coarse:duration-150",
              )}
            >
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      ref={handleRef}
                      aria-label={`Déplacer le passage ${index + 1}`}
                      className={cn(toolbarButtonClassName, "mr-2 cursor-grab")}
                    >
                      <GripVerticalIcon />
                    </Button>
                  }
                />
                <TooltipContent>Déplacer le passage</TooltipContent>
              </Tooltip>

              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onInsertAbove}
                      className={toolbarButtonClassName}
                    >
                      <AddAboveIcon />
                    </Button>
                  }
                />
                <TooltipContent>Insérer un passage au dessus</TooltipContent>
              </Tooltip>
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onInsertBelow}
                      className={toolbarButtonClassName}
                    >
                      <AddBelowIcon />
                    </Button>
                  }
                />
                <TooltipContent>Insérer un passage en dessous</TooltipContent>
              </Tooltip>
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onMoveUp}
                      className={toolbarButtonClassName}
                    >
                      <ArrowUpIcon />
                    </Button>
                  }
                />
                <TooltipContent>Déplacer le passage au dessus</TooltipContent>
              </Tooltip>
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onMoveDown}
                      className={toolbarButtonClassName}
                    >
                      <ArrowDownIcon />
                    </Button>
                  }
                />
                <TooltipContent>Déplacer le passage en dessous</TooltipContent>
              </Tooltip>
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onSplit}
                      className={toolbarButtonClassName}
                    >
                      <SquareSplitVerticalIcon />
                    </Button>
                  }
                />
                <TooltipContent>Diviser le passage en deux</TooltipContent>
              </Tooltip>
              <Tooltip disableHoverablePopup>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onRemove}
                      className={toolbarButtonClassName}
                    >
                      <TrashIcon />
                    </Button>
                  }
                />
                <TooltipContent>Supprimer le passage</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id={`passage.${id}.error`} errors={[error]} />
    </Field>
  );
}

const toolbarButtonClassName = cn(
  "scale-[0.25]",
  "opacity-0",
  "transition-all",
  "duration-150",
  "ease-out",
  "first:origin-right",
  "last:origin-left",

  "group-hover/toolbar-wrapper:scale-100",
  "group-hover/toolbar-wrapper:opacity-100",
  "group-hover/toolbar-wrapper:delay-100",

  "group-has-focus-visible/toolbar:scale-100",
  "group-has-focus-visible/toolbar:opacity-100",
  "group-has-focus-visible/toolbar:delay-100",

  "pointer-coarse:scale-100",
  "pointer-coarse:opacity-100",
  "pointer-coarse:delay-100",
);
