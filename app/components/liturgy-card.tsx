import { clsx } from "clsx";
import type { ComponentProps } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LiturgyBlockType } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const colorByType: Record<LiturgyBlockType, string> = {
  announcements: clsx("bg-taupe-600/10"),
  openDoors: clsx("bg-purple-900/10"),
  reading: clsx("bg-pink-900/10"),
  recitation: clsx("bg-stone-900/10"),
  section: clsx("bg-emerald-900/10"),
  sermon: clsx("bg-amber-900/10"),
  songs: clsx("bg-blue-900/10"),
};

interface LiturgyCardProps extends ComponentProps<typeof Card> {
  type: LiturgyBlockType;
}

function LiturgyCard({ type, className, ...props }: LiturgyCardProps) {
  return <Card {...props} className={cn(colorByType[type], className)} />;
}

interface LiturgyCardHeaderProps extends ComponentProps<typeof CardHeader> {}

function LiturgyCardHeader({ className, ...props }: LiturgyCardHeaderProps) {
  return <CardHeader {...props} className={cn("sticky", className)} />;
}

interface LiturgyCardTitleProps extends ComponentProps<typeof CardTitle> {}

function LiturgyCardTitle(props: LiturgyCardTitleProps) {
  return <CardTitle {...props} />;
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
