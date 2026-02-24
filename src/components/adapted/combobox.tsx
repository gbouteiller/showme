import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cva } from "class-variance-authority";
import { type ComponentPropsWithRef, useRef } from "react";
// Use adapted components
import { Button } from "@/components/adapted/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/adapted/input-group";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const COMBOBOX = {
  chip: cva(
    "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 whitespace-nowrap rounded-none bg-muted px-1.5 font-medium text-foreground text-xs has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-data-[slot=combobox-chip-remove]:pr-0 has-disabled:opacity-50"
  ),
  chipRemove: cva("-ml-1 opacity-50 hover:opacity-100"),
  chips: cva(
    "flex min-h-8 flex-wrap items-center gap-1 rounded-none border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-xs transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-data-[slot=combobox-chip]:px-1 has-aria-invalid:ring-1 has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40"
  ),
  chipsInput: cva("min-w-16 flex-1 outline-none"),
  clear: cva(""),
  content: cva(
    "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 group/combobox-content relative max-h-(--available-height) w-(--anchor-width) min-w-[calc(var(--anchor-width)+--spacing(7))] max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-none bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-closed:animate-out data-open:animate-in *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none"
  ),
  empty: cva("hidden w-full justify-center py-2 text-center text-muted-foreground text-xs group-data-empty/combobox-content:flex"),
  item: cva(
    "relative flex w-full cursor-default select-none items-center gap-2 rounded-none py-2 pr-8 pl-2 text-xs outline-hidden data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50 not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
  label: cva("px-2 py-2 text-muted-foreground text-xs"),
  list: cva(
    "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain data-empty:p-0"
  ),
  separator: cva("-mx-1 h-px bg-border"),
  trigger: cva("[&_svg:not([class*='size-'])]:size-4"),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export const Combobox = ComboboxPrimitive.Root;

// CHIP ------------------------------------------------------------------------------------------------------------------------------------
export function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip className={cn(COMBOBOX.chip(), className)} data-slot="combobox-chip" {...props}>
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          className={COMBOBOX.chipRemove()}
          data-slot="combobox-chip-remove"
          render={<Button size="icon-xs" variant="ghost" />}
        >
          <span className="icon-[ph--x] pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

// CHIPS -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxChips({
  className,
  ...props
}: ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> & ComboboxPrimitive.Chips.Props) {
  return <ComboboxPrimitive.Chips className={cn(COMBOBOX.chips(), className)} data-slot="combobox-chips" {...props} />;
}

// CHIPS INPUT -----------------------------------------------------------------------------------------------------------------------------
export function ComboboxChipsInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return <ComboboxPrimitive.Input className={cn(COMBOBOX.chipsInput(), className)} data-slot="combobox-chip-input" {...props} />;
}

// CLEAR -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      className={cn(COMBOBOX.clear(), className)}
      data-slot="combobox-clear"
      render={<InputGroupButton size="icon-xs" variant="ghost" />}
      {...props}
    >
      <span className="icon-[ph--x] pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

// COLLECTION ------------------------------------------------------------------------------------------------------------------------------
export function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
export function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props & Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <ComboboxPrimitive.Popup
          className={cn(COMBOBOX.content(), className)}
          data-chips={!!anchor}
          data-slot="combobox-content"
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

// EMPTY -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return <ComboboxPrimitive.Empty className={cn(COMBOBOX.empty(), className)} data-slot="combobox-empty" {...props} />;
}

// GROUP -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group className={cn(className)} data-slot="combobox-group" {...props} />;
}

// INPUT -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input render={<InputGroupInput disabled={disabled} />} {...props} />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            data-slot="input-group-button"
            disabled={disabled}
            render={<ComboboxTrigger />}
            size="icon-xs"
            variant="ghost"
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

// ITEM ------------------------------------------------------------------------------------------------------------------------------------
export function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item className={cn(COMBOBOX.item(), className)} data-slot="combobox-item" {...props}>
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
      >
        <span className="icon-[ph--check] pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

// LABEL -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return <ComboboxPrimitive.GroupLabel className={cn(COMBOBOX.label(), className)} data-slot="combobox-label" {...props} />;
}

// LIST ------------------------------------------------------------------------------------------------------------------------------------
export function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List className={cn(COMBOBOX.list(), className)} data-slot="combobox-list" {...props} />;
}

// SEPARATOR -------------------------------------------------------------------------------------------------------------------------------
export function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return <ComboboxPrimitive.Separator className={cn(COMBOBOX.separator(), className)} data-slot="combobox-separator" {...props} />;
}

// TRIGGER ---------------------------------------------------------------------------------------------------------------------------------
export function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger className={cn(COMBOBOX.trigger(), className)} data-slot="combobox-trigger" {...props}>
      {children}
      <span className="icon-[ph--caret-down] pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

// VALUE -----------------------------------------------------------------------------------------------------------------------------------
export function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

export function useComboboxAnchor() {
  return useRef<HTMLDivElement | null>(null);
}
