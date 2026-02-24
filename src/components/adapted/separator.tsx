import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const SEPARATOR = {
  root: cva("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch"),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function Separator({ className, orientation = "horizontal", ...props }: SeparatorPrimitive.Props) {
  return <SeparatorPrimitive className={cn(SEPARATOR.root(), className)} data-slot="separator" orientation={orientation} {...props} />;
}
