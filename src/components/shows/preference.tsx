import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import { Badge } from "@/components/adapted/badge";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";
import { IconButton, type IconButtonProps } from "../adapted/icon-button";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const SHOWS_PREFERENCE = {
  base: cva("gap-2"),
  icon: cva("size-5", {
    variants: {
      preference: {
        favorite: "icon-[line-md--heart-filled]",
        ignored: "icon-[mdi--heart-broken]",
        unset: "icon-[line-md--heart]",
      },
      theme: {
        default: "text-foreground",
        primary: "text-primary",
      },
    },
    defaultVariants: { theme: "default" },
  }),
};

// BADGE -----------------------------------------------------------------------------------------------------------------------------------
export function ShowsPreferenceBadge({ className, show }: ShowsPreferenceBadgeProps) {
  return (
    <Badge className={cn(SHOWS_PREFERENCE.base(), className)} variant="secondary">
      <ShowsPreferenceIcon show={show} />
    </Badge>
  );
}
type ShowsPreferenceBadgeProps = { className?: string; show: Shows["Entity"] };

// ICON ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsPreferenceIcon({ className, show: { preference } }: ShowsPreferenceIconProps) {
  return <span className={cn(SHOWS_PREFERENCE.icon({ preference, theme: "primary" }), className)} />;
}
type ShowsPreferenceIconProps = { className?: string; show: Shows["Entity"] };

// SWITCH ----------------------------------------------------------------------------------------------------------------------------------
export function ShowsPreferenceSwitch({ first, second, show }: ShowsPreferenceSwitchProps) {
  const { mutate: setPreference, isPending } = useMutation({ mutationFn: useConvexMutation(api.shows.setPreference) });

  const handleSetPreference = (preference: Shows["Preference"]) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // onSetPreference?.();
    setPreference({ _id: show._id, preference });
  };

  return (
    <>
      <IconButton
        icon={SHOWS_PREFERENCE.icon({ preference: show.preference !== "ignored" ? "ignored" : "unset" })}
        label={show.preference !== "ignored" ? "Ignore show" : "Stop ignoring show"}
        loading={isPending}
        onClick={handleSetPreference(show.preference !== "ignored" ? "ignored" : "unset")}
        size="icon-sm"
        {...first}
      />
      <IconButton
        icon={SHOWS_PREFERENCE.icon({ preference: show.preference !== "favorite" ? "favorite" : "unset" })}
        label={show.preference !== "favorite" ? "Add to favorites" : "Remove from favorites"}
        loading={isPending}
        onClick={handleSetPreference(show.preference !== "favorite" ? "favorite" : "unset")}
        size="icon-sm"
        {...second}
      />
    </>
  );
}
type ShowsPreferenceSwitchProps = { first?: Partial<IconButtonProps>; second?: Partial<IconButtonProps>; show: Shows["Entity"] };
