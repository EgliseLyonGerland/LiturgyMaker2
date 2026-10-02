import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface HeaderSlotProps {
  children: ReactNode;
}

function HeaderSlot({ children }: HeaderSlotProps) {
  const element = document.getElementById("header");

  return element ? createPortal(children, element) : null;
}

export { HeaderSlot };
