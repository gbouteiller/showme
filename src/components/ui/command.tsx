"use client";

import { Command as CommandPrimitive } from "cmdk";
import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CommandProps = ComponentPropsWithoutRef<typeof CommandPrimitive> & {
  shouldFilter?: boolean;
};

const Command = ({ className, shouldFilter = true, ...props }: CommandProps) => (
  <CommandPrimitive
    className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}
    shouldFilter={shouldFilter}
    {...props}
  />
);
Command.displayName = CommandPrimitive.displayName;

type CommandInputProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

const CommandInput = ({ className, ...props }: CommandInputProps) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <span className="icon-[lucide--search] mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
);
CommandInput.displayName = CommandPrimitive.Input.displayName;

type CommandListProps = ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const CommandList = ({ className, ...props }: CommandListProps) => (
  <CommandPrimitive.List className={cn("overflow-y-auto overflow-x-hidden", className)} {...props} />
);
CommandList.displayName = CommandPrimitive.List.displayName;

type CommandEmptyProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

const CommandEmpty = (props: CommandEmptyProps) => <CommandPrimitive.Empty className="py-6 text-center text-sm" {...props} />;
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

type CommandGroupProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;

const CommandGroup = ({ className, ...props }: CommandGroupProps) => (
  <CommandPrimitive.Group
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
      className
    )}
    {...props}
  />
);
CommandGroup.displayName = CommandPrimitive.Group.displayName;

type CommandSeparatorProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>;

const CommandSeparator = ({ className, ...props }: CommandSeparatorProps) => (
  <CommandPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
);
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

type CommandItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

const CommandItem = ({ className, ...props }: CommandItemProps) => (
  <CommandPrimitive.Item
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
);
CommandItem.displayName = CommandPrimitive.Item.displayName;

type CommandShortcutProps = HTMLAttributes<HTMLSpanElement>;

const CommandShortcut = ({ className, ...props }: CommandShortcutProps) => (
  <span className={cn("ml-auto text-muted-foreground text-xs tracking-widest", className)} {...props} />
);
CommandShortcut.displayName = "CommandShortcut";

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut };
