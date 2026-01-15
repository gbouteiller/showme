import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Link, linkOptions } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { api } from "convex/_generated/api";
import { Activity, useEffect } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/adapted/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { SearchBar } from "./-header.search-bar";

// import { SearchBar } from "./-header.search-bar";

// DATA ------------------------------------------------------------------------------------------------------------------------------------
const headerRoutes = [
  linkOptions({
    to: "/episodes/non-vus",
    label: "Épisodes non vus",
    icon: "icon-[lucide--eye]",
    activeProps: { className: "bg-muted text-unwatched" },
  }),
  linkOptions({
    to: "/episodes/a-venir",
    label: "À venir",
    icon: "icon-[lucide--calendar]",
    activeProps: { className: "bg-muted text-upcoming" },
  }),
  linkOptions({
    to: "/series/a-decouvrir",
    label: "Meilleures séries",
    icon: "icon-[lucide--star]",
    activeProps: { className: "bg-muted text-top-rated" },
  }),
  linkOptions({
    to: "/series/tendances",
    label: "Tendances",
    icon: "icon-[lucide--trending-up]",
    activeProps: { className: "bg-muted text-trending" },
  }),
  linkOptions({
    to: "/series/favorites",
    label: "Favoris",
    icon: "icon-[lucide--heart]",
    activeProps: { className: "bg-muted text-favorites" },
  }),
  linkOptions({
    to: "/parametres",
    label: "Paramètres",
    icon: "icon-[lucide--settings]",
    activeProps: { className: "bg-muted text-settings" },
  }),
];

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const HEADER = {
  base: cva("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"),
  progress: cva("fixed inset-x-0 top-0 z-50"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export default function Header() {
  return (
    <header className={HEADER.base()}>
      <MissingShowsProgress />
      <div className="w-full px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2 pl-1 transition-colors hover:text-primary" to="/">
              <span className="icon-[lucide--tv] size-5" />
              <h1 className="font-bold text-lg tracking-tight">
                Show<span className="text-primary">Me</span>
              </h1>
            </Link>
            <Separator orientation="vertical" />
            <nav className="flex items-center">
              <TooltipProvider>
                <div className="flex items-center gap-1.5">
                  {headerRoutes.map(({ activeProps, icon, label, to }) => (
                    <Tooltip key={to}>
                      <TooltipTrigger
                        render={
                          <Button
                            aria-label={label}
                            nativeButton={false}
                            render={<Link activeProps={activeProps} to={to} />}
                            size="icon"
                            variant="ghost"
                          />
                        }
                      >
                        <span className={cn("size-[18px]", "text-current", icon)} />
                      </TooltipTrigger>
                      <TooltipContent className="font-medium" side="bottom">
                        {label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </nav>
          </div>
          <div className="absolute left-1/2 w-full max-w-md -translate-x-1/2 transform">
            <SearchBar />
          </div>
          <div className="flex items-center gap-3 pr-1">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

// PROGRESS --------------------------------------------------------------------------------------------------------------------------------
export function MissingShowsProgress() {
  const { data } = useQuery({
    ...convexQuery(api.fetcher.read),
    select: (fetcher) => ({ created: fetcher?.created ?? 0, isPending: fetcher?.isPending ?? true }),
  });

  useEffect(() => {
    if (data && !data.isPending && data.created > 0) toast.success(`${data.created} séries ajoutées avec succès`);
  }, [data]);

  return (
    <Activity mode={data?.isPending ? "visible" : "hidden"}>
      <Progress className={HEADER.progress()} value={null} />
    </Activity>
  );
}

// THEME SWITCHER --------------------------------------------------------------------------------------------------------------------------
const THEME_SWITCHER = {
  dark: cva("icon-[lucide--sun] size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"),
  light: cva("icon-[lucide--moon] absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"),
};

export function ThemeSwitcher() {
  const { appTheme, setTheme } = useTheme();

  function onClickToggle() {
    setTheme(appTheme === "light" ? "dark" : "light");
  }

  return (
    <Button onClick={onClickToggle} size="icon" type="button" variant="outline">
      <span className={THEME_SWITCHER.dark()} />
      <span className={THEME_SWITCHER.light()} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
