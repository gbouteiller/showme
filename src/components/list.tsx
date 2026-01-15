import { Link, type LinkOptions } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/adapted/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const LIST = {
  icon: cva("h-5 w-5", {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "text-primary",
        topRated: "text-top-rated",
        trending: "text-trending",
        unwatched: "text-unwatched",
        upcoming: "text-upcoming",
      },
    },
  }),
  title: cva("flex items-center gap-2 font-bold text-xl"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------

export function List({ children, icon, link, title, variant }: ListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={LIST.title()}>
          <span className={cn(icon, LIST.icon({ variant }))} /> {title}
        </CardTitle>
        <CardAction>
          <Button nativeButton={false} render={<Link {...link} />} variant="link">
            Voir tout
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type ListProps = VariantProps<typeof LIST.icon> & {
  children: React.ReactNode;
  icon: string;
  link: LinkOptions;
  title: string;
};
