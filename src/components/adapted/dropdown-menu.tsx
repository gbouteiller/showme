import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const DROPDOWN_MENU = {
  checkboxIndicator: cva("pointer-events-none absolute right-2 flex items-center justify-center"),
  checkboxItem: cva(
    "relative flex cursor-default select-none items-center gap-2 rounded-none py-2 pr-8 pl-2 text-xs outline-hidden focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
  content: cva(
    "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-none bg-popover text-popover-foreground shadow-md outline-none ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in data-closed:overflow-hidden"
  ),
  item: cva(
    "group/dropdown-menu-item relative flex cursor-default select-none items-center gap-2 rounded-none px-2 py-2 text-xs outline-hidden focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-inset:pl-7 data-[variant=destructive]:text-destructive data-disabled:opacity-50 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:*:[svg]:text-destructive"
  ),
  label: cva("px-2 py-2 text-muted-foreground text-xs data-inset:pl-7"),
  radioIndicator: cva("pointer-events-none absolute right-2 flex items-center justify-center"),
  radioItem: cva(
    "relative flex cursor-default select-none items-center gap-2 rounded-none py-2 pr-8 pl-2 text-xs outline-hidden focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
  separator: cva("-mx-1 h-px bg-border"),
  shortcut: cva("ml-auto text-muted-foreground text-xs tracking-widest group-focus/dropdown-menu-item:text-accent-foreground"),
  subContent: cva(
    "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-auto min-w-[96px] rounded-none bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in"
  ),
  subTrigger: cva(
    "flex cursor-default select-none items-center gap-2 rounded-none px-2 py-2 text-xs outline-hidden focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-open:bg-accent data-popup-open:bg-accent data-inset:pl-7 data-open:text-accent-foreground data-popup-open:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
  ),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

// CHECKBOX ITEM ---------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuCheckboxItem({ className, children, checked, ...props }: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(DROPDOWN_MENU.checkboxItem(), className)}
      data-slot="dropdown-menu-checkbox-item"
      {...props}
    >
      <span className={DROPDOWN_MENU.checkboxIndicator()} data-slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <span className="icon-[ph--check]" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup className={cn(DROPDOWN_MENU.content(), className)} data-slot="dropdown-menu-content" {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

// GROUP -----------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

// ITEM ------------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      className={cn(DROPDOWN_MENU.item(), className)}
      data-inset={inset}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      {...props}
    />
  );
}

// LABEL -----------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuLabel({ className, inset, ...props }: MenuPrimitive.GroupLabel.Props & { inset?: boolean }) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(DROPDOWN_MENU.label(), className)}
      data-inset={inset}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
}

// PORTAL ----------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

// RADIO GROUP -----------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

// RADIO ITEM ------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuRadioItem({ className, children, inset, ...props }: MenuPrimitive.RadioItem.Props & { inset?: boolean }) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(DROPDOWN_MENU.radioItem(), className)}
      data-inset={inset}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <span className={DROPDOWN_MENU.radioIndicator()} data-slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <span className="icon-[ph--check]" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

// SEPARATOR -------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator className={cn(DROPDOWN_MENU.separator(), className)} data-slot="dropdown-menu-separator" {...props} />;
}

// SHORTCUT --------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(DROPDOWN_MENU.shortcut(), className)} data-slot="dropdown-menu-shortcut" {...props} />;
}

// SUB -------------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

// SUB CONTENT -----------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      align={align}
      alignOffset={alignOffset}
      className={cn(DROPDOWN_MENU.subContent(), className)}
      data-slot="dropdown-menu-sub-content"
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

// SUB TRIGGER -----------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuSubTrigger({ className, inset, children, ...props }: MenuPrimitive.SubmenuTrigger.Props & { inset?: boolean }) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(DROPDOWN_MENU.subTrigger(), className)}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      {...props}
    >
      {children}
      <span className="icon-[ph--caret-right] ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

// TRIGGER ---------------------------------------------------------------------------------------------------------------------------------
export function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}
