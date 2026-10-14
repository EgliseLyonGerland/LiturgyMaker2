import type { FieldPath } from "react-hook-form";

import type { Liturgy, LiturgyBlockType } from "./schemas";

export function getBlockFocusName(
  type: LiturgyBlockType,
  blockIndex: number,
  itemIndex = 0,
): FieldPath<Liturgy> {
  const name = `blocks.${blockIndex}` as const;

  if (type === "songs") {
    return `${name}.data.items.${itemIndex}.id`;
  }

  if (type === "reading") {
    return `${name}.data.bibleRefs.${itemIndex}.id`;
  }

  return name;
}
