import { mergeProps, Popover, useRender } from "@base-ui/react";
import { cn } from "cn";
import React, { type ComponentProps } from "react";

import { Button } from "@/components/ui/button";

interface ConfirmDropdownContextProps {
  open: boolean;
  close: () => void;
}

const ConfirmDropdownContext = React.createContext<ConfirmDropdownContextProps | undefined>(
  undefined,
);

function useControllableState<T>({
  value: controlledValue,
  onChange,
  defaultValue,
}: {
  value?: T;
  onChange?: (value: T) => void;
  defaultValue: T;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = React.useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  return [value, setValue] as const;
}

interface RootProps extends Omit<Popover.Root.Props, "open" | "onOpenChange"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Root({ open: controlledOpen, onOpenChange, ...props }: RootProps) {
  const [open, setOpen] = useControllableState({
    value: controlledOpen,
    onChange: onOpenChange,
    defaultValue: false,
  });

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  return (
    <ConfirmDropdownContext.Provider value={{ open, close }}>
      <Popover.Root {...props} open={open} onOpenChange={setOpen} modal="trap-focus" />
    </ConfirmDropdownContext.Provider>
  );
}

interface TriggerProps extends Popover.Trigger.Props {}

const Trigger = Popover.Trigger;

interface ContentProps extends Popover.Popup.Props {
  children: React.ReactNode;
}

function Content({ children, className, ...props }: ContentProps) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        sideOffset={8}
        collisionAvoidance={{
          align: "shift",
          side: "shift",
        }}
      >
        <Popover.Popup
          className={cn(
            "z-50 flex max-h-(--available-height) origin-(--transform-origin) flex-col items-center gap-4 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-4 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          data-tracker-id="confirm-popover-content"
          {...props}
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

interface TitleProps extends React.HTMLProps<HTMLDivElement> {}

function Title({ className, ...props }: TitleProps) {
  return <div {...props} className={cn("text-base", className)} />;
}

interface ActionsProps extends React.HTMLProps<HTMLDivElement> {}

function Actions({ className, ...props }: ActionsProps) {
  return <div {...props} className={cn("flex gap-2", className)} />;
}

interface CancelProps extends Partial<ComponentProps<typeof Button>> {}

function Cancel({ onClick, ...props }: CancelProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
  };

  return (
    <Popover.Close
      render={
        <Button
          type="button"
          variant="outline"
          data-tracker-id="confirm-popover-cancel-button"
          {...props}
          onClick={handleClick}
        />
      }
    />
  );
}

interface ConfirmProps extends Partial<ComponentProps<typeof Button>> {}

function Confirm({ onClick, ...props }: ConfirmProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
  };

  return (
    <Popover.Close
      render={
        <Button
          type="button"
          data-tracker-id="confirm-popover-confirm"
          {...props}
          onClick={handleClick}
        />
      }
    />
  );
}

export const ConfirmDropdown = { Root, Trigger, Content, Title, Actions, Cancel, Confirm };

export type {
  RootProps,
  TriggerProps,
  ContentProps,
  TitleProps,
  ActionsProps,
  CancelProps,
  ConfirmProps,
};
