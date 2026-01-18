import { cva } from "class-variance-authority";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "./button";
import { Button } from "./button";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const ICON_BUTTON = {
  base: cva("", {
    variants: {
      loading: {
        true: "cursor-wait",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      loading: false,
    },
  }),

  icon: cva("size-5", {
    variants: {
      loading: {
        true: "icon-[lucide--loader2] animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      loading: false,
    },
  }),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function IconButton(props: IconButtonProps) {
  const { icon, label, loading = false, className, disabled, size = "icon", variant = "outline", ...rest } = props;
  const isDisabled = disabled || loading;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className={cn(ICON_BUTTON.base({ className, loading }))}
            disabled={isDisabled}
            size={size}
            variant={variant}
            {...rest}
          />
        }
      >
        <span className={cn(ICON_BUTTON.icon({ loading }), icon)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export type IconButtonProps = { className?: string; icon: string; label: string; loading?: boolean } & ButtonProps;
