import { cn } from "cn";
import { EllipsisVerticalIcon, TrashIcon } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";

import { ConfirmDropdown } from "@/components/confirm-dropdown";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { liturgyBlockIcons, liturgyBlockNames } from "@/config";
import { useLiturgyBlockContext } from "@/lib/liturgy-context";
import type { LiturgyBlockType } from "@/lib/schemas";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const colorByType: Record<LiturgyBlockType, string> = {
  announcements: cn("bg-taupe-600/10"),
  openDoors: cn("bg-purple-900/10"),
  reading: cn("bg-pink-900/10"),
  recitation: cn("bg-stone-900/10"),
  section: cn("bg-emerald-900/10"),
  sermon: cn("bg-amber-900/10"),
  songs: cn("bg-blue-900/10"),
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
  type: LiturgyBlockType;
}

function LiturgyCard({ type, className, ...props }: LiturgyCardProps) {
  return (
    <context.Provider value={{ type }}>
      <Card {...props} className={cn(colorByType[type], className)} />
    </context.Provider>
  );
}

interface LiturgyCardHeaderProps extends ComponentProps<typeof CardHeader> {}

function LiturgyCardHeader({ className, children, ...props }: LiturgyCardHeaderProps) {
  const { remove } = useLiturgyBlockContext();

  return (
    <CardHeader {...props} className={cn("flex items-center border-b border-border", className)}>
      {children}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="ghost" size="icon" className="ml-auto">
              <EllipsisVerticalIcon />
            </Button>
          }
        />
        <DropdownMenuContent className="min-w-40" align="end">
          <DropdownMenuGroup>
            <ConfirmDropdown.Root>
              <ConfirmDropdown.Trigger
                nativeButton={false}
                render={
                  <DropdownMenuItem tabIndex={-1} closeOnClick={false} variant="destructive">
                    <TrashIcon />
                    Supprimer
                  </DropdownMenuItem>
                }
              />
              <ConfirmDropdown.Content>
                <ConfirmDropdown.Title>
                  Êtes-vous sûr de vouloir supprimer ce bloc ?
                </ConfirmDropdown.Title>
                <ConfirmDropdown.Actions>
                  <ConfirmDropdown.Cancel>Non</ConfirmDropdown.Cancel>
                  <ConfirmDropdown.Confirm onClick={remove}>Oui</ConfirmDropdown.Confirm>
                </ConfirmDropdown.Actions>
              </ConfirmDropdown.Content>
            </ConfirmDropdown.Root>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
  );
}

interface LiturgyCardTitleProps extends ComponentProps<typeof CardTitle> {}

function LiturgyCardTitle({ className, children, ...props }: LiturgyCardTitleProps) {
  const { type } = useLiturgyCardContext();

  const Icon = liturgyBlockIcons[type];

  return (
    <CardTitle {...props} className={cn("flex items-center gap-2", className)}>
      <Icon className="size-5" />
      {liturgyBlockNames[type]}

      {children}
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
  return <CardFooter {...props} className={cn("bg-black/20", className)} />;
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
