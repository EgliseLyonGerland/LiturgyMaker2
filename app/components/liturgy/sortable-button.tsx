import { cn } from "cn";
import { GripVerticalIcon } from "lucide-react";
import type { ComponentProps } from "react";

export interface SortableButtonProps extends ComponentProps<"button"> {}

export function SortableButton({ className, ...props }: SortableButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "h-8 cursor-grab opacity-80 hover:not-disabled:opacity-100 disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      {...props}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
}
