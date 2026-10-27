import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { type LucideProps } from "lucide-react";
import { useRef } from "react";
import { type UseFieldArrayReturn, useFormContext, useWatch } from "react-hook-form";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { liturgyBlockIcons, liturgyBlockNames } from "@/config";
import {
  type Liturgy,
  type LiturgyBlockType,
  type RecitationWithId,
  type SongWithId,
} from "@/lib/schemas";

import { SortableButton } from "./sortable-button";

type Fields = UseFieldArrayReturn<Liturgy, "blocks", "id">["fields"];

function getDescription(
  field: Liturgy["blocks"][number],
  songs: SongWithId[],
  recitations: RecitationWithId[],
) {
  switch (field.type) {
    case "reading":
      return field.data.bibleRefs.map((ref) => ref.id);

    case "recitation": {
      const recitation = recitations.find((item) => item.id === field.data.id);
      return recitation ? [recitation.title] : null;
    }

    case "songs": {
      const fieldSongs = field.data.items
        .map((item) => songs.find((song) => song.id === item.id))
        .filter(Boolean);

      return fieldSongs.length ? fieldSongs.map((song) => song.title) : null;
    }

    case "sermon":
      return [field.data.title, ...field.data.bibleRefs.map((ref) => ref.id)];

    case "section":
      return [field.data.title];

    case "openDoors":
      return [field.data.title];

    default:
      return null;
  }
}

export interface LiturgyMenuProps {
  fields: Fields;
  songs: SongWithId[];
  recitations: RecitationWithId[];
  className?: string;
  onClick: (field: Fields[number]) => void;
  onMove: (from: number, to: number) => void;
}

export function LiturgyMenu({
  fields,
  songs,
  recitations,
  className,
  onClick,
  onMove,
}: LiturgyMenuProps) {
  return (
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
      <div
        className={cn(
          "sticky top-(--header-height) h-[calc(100vh-var(--header-height))] min-h-0 w-full scroll-fade scrollbar-thumb-muted overflow-y-auto overscroll-none py-4 pr-4",
          className,
        )}
        aria-hidden
      >
        {fields.map((field, index) => (
          <MenuItem
            key={field.id}
            field={field}
            index={index}
            songs={songs}
            recitations={recitations}
            onClick={() => onClick(field)}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}

interface MenuItemProps {
  field: Fields[number];
  index: number;
  songs: SongWithId[];
  recitations: RecitationWithId[];
  onClick: () => void;
}

function MenuItem({ field, index, songs, recitations, onClick }: MenuItemProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useSortable({ id: field.id, index, handle: handleRef });
  const { control } = useFormContext<Liturgy>();
  const block = useWatch({ control, name: `blocks.${index}`, defaultValue: field });

  const description = getDescription(block, songs, recitations);

  return (
    <Item
      ref={ref}
      className="group"
      size="xs"
      render={
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onClick();
          }}
        >
          <ItemMedia>
            <BlockIcon type={field.type} className="size-4" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{liturgyBlockNames[field.type]}</ItemTitle>
            {description && (
              <ItemDescription className="line-clamp-none flex flex-col text-xs">
                {description.map((line) => (
                  <span key={line} className="mt-0.5">
                    {line}
                  </span>
                ))}
              </ItemDescription>
            )}
          </ItemContent>
          <ItemActions>
            <SortableButton
              className="invisible h-auto group-hover:visible group-focus-visible:visible"
              ref={handleRef}
            />
          </ItemActions>
        </a>
      }
    />
  );
}

interface BlockIconProps extends LucideProps {
  type: LiturgyBlockType;
}

function BlockIcon({ type, ...props }: BlockIconProps) {
  const Icon = liturgyBlockIcons[type];

  return <Icon className="size-6" {...props} />;
}
