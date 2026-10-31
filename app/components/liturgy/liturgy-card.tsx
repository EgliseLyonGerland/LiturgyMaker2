import { cn } from "cn";
import { EllipsisVerticalIcon, TrashIcon } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";

import {
  ConfirmDropdown,
  ConfirmDropdownActions,
  ConfirmDropdownCancel,
  ConfirmDropdownConfirm,
  ConfirmDropdownContent,
  ConfirmDropdownTitle,
  ConfirmDropdownTrigger,
} from "@/components/confirm-dropdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { liturgyBlockIcons, liturgyBlockNames } from "@/config";
import { useLiturgyBlockContext } from "@/lib/liturgy-context";
import type { LiturgyBlockType } from "@/lib/schemas";

const colorByType: Record<LiturgyBlockType, Record<string, string>> = {
  reading: {
    "--color-100": "var(--color-taupe-100)",
    "--color-400": "var(--color-taupe-400)",
    "--color-900": "var(--color-taupe-600)",
  },
  openDoors: {
    "--color-100": "var(--color-indigo-100)",
    "--color-400": "var(--color-indigo-400)",
    "--color-900": "var(--color-indigo-900)",
  },
  announcements: {
    "--color-100": "var(--color-fuchsia-100)",
    "--color-400": "var(--color-fuchsia-400)",
    "--color-900": "var(--color-fuchsia-900)",
  },
  recitation: {
    "--color-100": "var(--color-red-100)",
    "--color-400": "var(--color-red-400)",
    "--color-900": "var(--color-red-900)",
  },
  section: {
    "--color-100": "var(--color-emerald-100)",
    "--color-400": "var(--color-emerald-400)",
    "--color-900": "var(--color-emerald-900)",
  },
  sermon: {
    "--color-100": "var(--color-amber-100)",
    "--color-400": "var(--color-amber-400)",
    "--color-900": "var(--color-amber-900)",
  },
  songs: {
    "--color-100": "var(--color-blue-100)",
    "--color-400": "var(--color-blue-400)",
    "--color-900": "var(--color-blue-900)",
  },
};

interface Context {
  type: LiturgyBlockType;
}

const context = createContext<Context | null>(null);

function useLiturgyCardContext() {
  const contextValue = useContext(context);

  if (!contextValue) {
    throw new Error("useLiturgyCardContext must be used within a LiturgyCardProvider");
  }

  return contextValue;
}

interface LiturgyCardProps extends ComponentProps<typeof Card> {
  id: string;
  type: LiturgyBlockType;
}

function LiturgyCard({ id, type, className, ...props }: LiturgyCardProps) {
  return (
    <context.Provider value={{ type }}>
      <Card
        id={id}
        {...props}
        className={cn(
          "pt-0 ring ring-(--color-400) dark:bg-(--color-900)/10 dark:ring-(--color-900)/60",
          className,
        )}
        style={colorByType[type] as React.CSSProperties}
      />
    </context.Provider>
  );
}

interface LiturgyCardHeaderProps extends ComponentProps<typeof CardHeader> {}

function LiturgyCardHeader({ className, children, ...props }: LiturgyCardHeaderProps) {
  const { type } = useLiturgyCardContext();
  const { remove, fillFromPreviousWeek } = useLiturgyBlockContext();

  return (
    <CardHeader
      {...props}
      className={cn(
        "mb-0 flex h-16 items-center border-b border-border bg-(--color-100)/70 pb-0! dark:bg-transparent",
        className,
      )}
      style={colorByType[type] as React.CSSProperties}
    >
      {children}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon" className="ml-auto">
              <EllipsisVerticalIcon />
            </Button>
          }
        />
        <DropdownMenuContent className="w-auto min-w-40" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={fillFromPreviousWeek}>
              Remplir à partir de la semaine précédente
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ConfirmDropdown>
              <ConfirmDropdownTrigger
                nativeButton={false}
                render={
                  <DropdownMenuItem tabIndex={-1} closeOnClick={false} variant="destructive">
                    <TrashIcon />
                    Supprimer
                  </DropdownMenuItem>
                }
              />
              <ConfirmDropdownContent>
                <ConfirmDropdownTitle>
                  Êtes-vous sûr de vouloir supprimer ce bloc ?
                </ConfirmDropdownTitle>
                <ConfirmDropdownActions>
                  <ConfirmDropdownCancel>Non</ConfirmDropdownCancel>
                  <ConfirmDropdownConfirm onClick={remove}>Oui</ConfirmDropdownConfirm>
                </ConfirmDropdownActions>
              </ConfirmDropdownContent>
            </ConfirmDropdown>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
  );
}

interface LiturgyCardTitleProps extends Omit<ComponentProps<typeof CardTitle>, "children"> {
  extraLabel?: string;
}

function LiturgyCardTitle({ className, extraLabel, ...props }: LiturgyCardTitleProps) {
  const { type } = useLiturgyCardContext();

  const Icon = liturgyBlockIcons[type];

  return (
    <CardTitle
      {...props}
      className={cn("grid grid-cols-[auto_1fr] items-center gap-0.5 gap-x-3", className)}
    >
      <Icon className="size-4.5" />
      {liturgyBlockNames[type]}
      {extraLabel && (
        <span className="col-start-2 text-xs text-muted-foreground">{extraLabel}</span>
      )}
    </CardTitle>
  );
}

interface LiturgyCardActionProps extends ComponentProps<typeof CardAction> {}

function LiturgyCardAction(props: LiturgyCardActionProps) {
  return <CardAction {...props} />;
}

interface LiturgyCardContentProps extends ComponentProps<typeof CardContent> {}

function LiturgyCardContent(props: LiturgyCardContentProps) {
  return <CardContent {...props} />;
}

interface LiturgyCardFooterProps extends ComponentProps<typeof CardFooter> {}

function LiturgyCardFooter({ className, ...props }: LiturgyCardFooterProps) {
  const { type } = useLiturgyCardContext();

  return (
    <CardFooter
      {...props}
      className={cn("bg-(--color-100)/50 dark:bg-(--color-900)/10", className)}
      style={colorByType[type] as React.CSSProperties}
    />
  );
}

interface LiturgyCardSeparatorProps extends React.ComponentProps<"div"> {}

function LiturgyCardSeparator(props: LiturgyCardSeparatorProps) {
  return <Separator {...props} />;
}

export {
  LiturgyCard,
  LiturgyCardHeader,
  LiturgyCardTitle,
  LiturgyCardAction,
  LiturgyCardContent,
  LiturgyCardFooter,
  LiturgyCardSeparator,
};
