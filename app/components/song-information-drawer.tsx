import type { DrawerTriggerProps } from "@base-ui/react";
import { cn } from "cn";

import { useIsMobile } from "@/hooks/use-mobile";
import { prepareLyrics } from "@/lib/lyrics-utils";
import type { Lyrics, SongWithId } from "@/lib/schemas";

import Preview from "./preview";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Separator } from "./ui/separator";

interface SongInformationDrawerProps {
  song: SongWithId;
  lyrics?: Lyrics;
  trigger: DrawerTriggerProps["render"];
  footer?: React.ReactNode;
}

function SongInformationDrawer(props: SongInformationDrawerProps) {
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

function ItemInformationDrawerContent({ song, lyrics, footer }: SongInformationDrawerProps) {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-lg">
          {song.title} {song.aka && <span>({song.aka})</span>}
        </DrawerTitle>
        <DrawerDescription>{song.authors || <i>Aucun auteur</i>}</DrawerDescription>
      </DrawerHeader>

      <Separator className="my-4" />

      <div className="flex-1 scroll-fade overflow-y-auto px-4">
        {song.previewUrl && (
          <>
            <Preview title={song.title} url={song.previewUrl} />
            <Separator className="my-4" />
          </>
        )}

        <div className="mb-10 flex flex-col gap-4">
          {prepareLyrics(lyrics ?? song.lyrics).map(({ type, lines }, lyricIndex) => (
            <div key={lyricIndex}>
              {lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className={cn("pl-4 -indent-4 sm:tracking-wide", type === "chorus" && "pl-8")}
                >
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {footer && <DrawerFooter>{footer}</DrawerFooter>}
    </>
  );
}

export { SongInformationDrawer };
