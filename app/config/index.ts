import type { LiturgyBlockType } from "@liturgy-maker/shared";
import {
  BookOpenTextIcon,
  CaptionsIcon,
  FishIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  MusicIcon,
  UserGroupIcon,
  type LucideIcon,
} from "lucide-react";

export const liturgyBlockTypes: LiturgyBlockType[] = [
  "announcements",
  "reading",
  "section",
  "sermon",
  "songs",
  "recitation",
  "openDoors",
] as const;

export const liturgyBlockNames: Record<LiturgyBlockType, string> = {
  announcements: "Annonces",
  reading: "Lecture",
  section: "Section",
  sermon: "Prédication",
  songs: "Chants",
  recitation: "Récitation",
  openDoors: "Portes ouvertes",
};

export const liturgyBlockIcons: Record<LiturgyBlockType, LucideIcon> = {
  announcements: MegaphoneIcon,
  openDoors: FishIcon,
  reading: BookOpenTextIcon,
  recitation: UserGroupIcon,
  section: CaptionsIcon,
  sermon: GraduationCapIcon,
  songs: MusicIcon,
};
