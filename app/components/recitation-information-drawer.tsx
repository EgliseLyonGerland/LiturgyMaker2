import type { DrawerTriggerProps } from "@base-ui/react";
import { cn } from "cn";

import { useIsMobile } from "@/hooks/use-mobile";
import type { RecitationWithId } from "@/lib/schemas";

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Separator } from "./ui/separator";

interface RecitationInformationDrawerProps {
  recitation: RecitationWithId;
  trigger: DrawerTriggerProps["render"];
  footer?: React.ReactNode;
}

function RecitationInformationDrawer(props: RecitationInformationDrawerProps) {
  const { trigger } = props;
  const isMobile = useIsMobile();

  return (
    <Drawer showSwipeHandle={isMobile} swipeDirection={isMobile ? "down" : "right"}>
      <DrawerTrigger render={trigger} />
      <DrawerContent className={cn(!isMobile && "w-[90%] max-w-xl")}>
        <ItemInformationDrawerContent {...props} />
      </DrawerContent>
    </Drawer>
  );
}

function ItemInformationDrawerContent({ recitation, footer }: RecitationInformationDrawerProps) {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-lg">{recitation.title}</DrawerTitle>
      </DrawerHeader>

      <Separator className="my-4" />

      <div className="flex-1 scroll-fade overflow-y-auto px-4">
        <div className="mb-10 flex flex-col gap-4">
          {recitation.content.map((part, contentIndex) => (
            <div key={contentIndex} className="whitespace-pre-wrap">
              {part.text}
            </div>
          ))}
        </div>
      </div>

      {footer && <DrawerFooter>{footer}</DrawerFooter>}
    </>
  );
}

export { RecitationInformationDrawer };
