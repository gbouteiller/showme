import { Link } from "@tanstack/react-router";
import type { Shows } from "@/schemas/shows";
import { IconButton, type IconButtonProps } from "../adapted/icon-button";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsLink({ show: { _id: showId }, ...props }: ShowsLinkProps) {
  return (
    <IconButton
      icon="icon-[lucide--chevron-right]"
      label="View details"
      nativeButton={false}
      render={<Link params={{ showId }} to={"/shows/$showId"} />}
      size="icon-sm"
      variant="default"
      {...props}
    />
  );
}
type ShowsLinkProps = Partial<IconButtonProps> & { show: Shows["Entity"] };
