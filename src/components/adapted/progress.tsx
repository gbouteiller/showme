import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const PROGRESS = {
  root: cva("flex flex-wrap gap-3"),
  track: cva("relative flex h-1.5 w-full items-center overflow-x-hidden bg-muted"),
  indicator: cva("h-full bg-primary transition-all", {
    variants: {
      indeterminate: {
        true: "w-full origin-left animate-progress",
      },
    },
  }),
  label: cva("font-medium text-sm"),
  value: cva("ml-auto text-primary text-sm tabular-nums"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function Progress({ className, children, value, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root className={cn(PROGRESS.root(), className)} data-slot="progress" value={value} {...props}>
      {children}
      <ProgressTrack>
        <ProgressIndicator indeterminate={value === null} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

// TRACK -----------------------------------------------------------------------------------------------------------------------------------
export function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return <ProgressPrimitive.Track className={cn(PROGRESS.track(), className)} data-slot="progress-track" {...props} />;
}

// INDICATOR -------------------------------------------------------------------------------------------------------------------------------
export function ProgressIndicator({ className, indeterminate, ...props }: ProgressIndicatorProps) {
  return (
    <ProgressPrimitive.Indicator
      className={cn(PROGRESS.indicator({ indeterminate }), className)}
      data-slot="progress-indicator"
      {...props}
    />
  );
}
type ProgressIndicatorProps = ProgressPrimitive.Indicator.Props & { indeterminate: boolean };

// LABEL -----------------------------------------------------------------------------------------------------------------------------------
export function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return <ProgressPrimitive.Label className={cn(PROGRESS.label(), className)} data-slot="progress-label" {...props} />;
}

// VALUE -----------------------------------------------------------------------------------------------------------------------------------
export function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return <ProgressPrimitive.Value className={cn(PROGRESS.value(), className)} data-slot="progress-value" {...props} />;
}
