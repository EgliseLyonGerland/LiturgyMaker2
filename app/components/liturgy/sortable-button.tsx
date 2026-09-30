import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import type { ComponentProps } from "react";

export interface SortableButtonProps extends ComponentProps<"button"> {}

export function SortableButton({ className, ...props }: SortableButtonProps) {
  return (
    <button
      className={cn("h-8 cursor-grab disabled:pointer-events-none disabled:opacity-50", className)}
      {...props}
    >
      <MenuIcon className="size-4" />
    </button>
  );
}
