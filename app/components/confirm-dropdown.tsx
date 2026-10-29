import { Popover } from "@base-ui/react";
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

interface ConfirmDropdownRootProps extends Omit<Popover.Root.Props, "open" | "onOpenChange"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ConfirmDropdown({
  open: controlledOpen,
  onOpenChange,
  ...props
}: ConfirmDropdownRootProps) {
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

interface ConfirmDropdownTriggerProps extends Popover.Trigger.Props {}

const ConfirmDropdownTrigger = Popover.Trigger;

interface ConfirmDropdownContentProps extends Popover.Popup.Props {
  children: React.ReactNode;
}

function ConfirmDropdownContent({ children, className, ...props }: ConfirmDropdownContentProps) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        className="isolate z-50"
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

interface ConfirmDropdownTitleProps extends React.HTMLProps<HTMLDivElement> {}

function ConfirmDropdownTitle({ className, ...props }: ConfirmDropdownTitleProps) {
  return <div {...props} className={cn("text-base", className)} />;
}

interface ConfirmDropdownDescriptionProps extends React.HTMLProps<HTMLDivElement> {}

function ConfirmDropdownDescription({ className, ...props }: ConfirmDropdownDescriptionProps) {
  return (
    <div
      {...props}
      className={cn("text-sm text-balance text-muted-foreground md:text-pretty", className)}
    />
  );
}

interface ConfirmDropdownActionsProps extends React.HTMLProps<HTMLDivElement> {}

function ConfirmDropdownActions({ className, ...props }: ConfirmDropdownActionsProps) {
  return <div {...props} className={cn("flex gap-2", className)} />;
}

interface ConfirmDropdownCancelProps extends Partial<ComponentProps<typeof Button>> {}

function ConfirmDropdownCancel({ onClick, ...props }: ConfirmDropdownCancelProps) {
  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
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

interface ConfirmDropdownConfirmProps extends Partial<ComponentProps<typeof Button>> {}

function ConfirmDropdownConfirm({ onClick, ...props }: ConfirmDropdownConfirmProps) {
  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
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

export {
  ConfirmDropdown,
  ConfirmDropdownTrigger,
  ConfirmDropdownContent,
  ConfirmDropdownTitle,
  ConfirmDropdownDescription,
  ConfirmDropdownActions,
  ConfirmDropdownCancel,
  ConfirmDropdownConfirm,
};

export type {
  ConfirmDropdownRootProps,
  ConfirmDropdownTriggerProps,
  ConfirmDropdownContentProps,
  ConfirmDropdownTitleProps,
  ConfirmDropdownDescriptionProps,
  ConfirmDropdownActionsProps,
  ConfirmDropdownCancelProps,
  ConfirmDropdownConfirmProps,
};
