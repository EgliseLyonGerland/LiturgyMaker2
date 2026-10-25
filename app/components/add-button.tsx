import type { ComponentProps } from "react";

import { Button } from "./ui/button";

export interface AddButtonProps extends ComponentProps<"button"> {}

export function AddButton({ children, className, ...props }: AddButtonProps) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-px flex-1 bg-border" />
      <Button {...props} variant="secondary" className={className}>
        {children}
      </Button>
      <div className="h-px flex-1 bg-border" />
    </div>
  );

  // return (
  //   <button
  //     type="button"
  //     className={cn(
  //       "group flex h-6 w-full cursor-pointer items-center text-sm text-background transition-[height] outline-none hover:h-15 hover:delay-300 focus-visible:h-15 aria-expanded:h-15",
  //       "[&_.lucide]:size-4",
  //       className,
  //     )}
  //     {...props}
  //   >
  //     <div className="w-full cursor-pointer rounded-md bg-border transition-colors group-hover:bg-foreground group-hover:delay-50 group-focus-visible:border-ring group-focus-visible:bg-foreground group-focus-visible:ring-3 group-focus-visible:ring-ring group-aria-expanded:bg-foreground/80">
  //       <div className="flex h-px items-center justify-center overflow-hidden transition-[height] group-hover:h-8 group-hover:delay-300 group-focus-visible:h-8 group-aria-expanded:h-8">
  //         <span className="inline-flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-300 group-focus-visible:opacity-100 group-aria-expanded:opacity-100">
  //           {children}
  //         </span>
  //       </div>
  //     </div>
  //   </button>
  // );
}
