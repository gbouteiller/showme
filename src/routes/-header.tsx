import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Link, linkOptions } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Activity, useEffect } from "react";
import { toast } from "sonner";
import { IconButton } from "@/components/adapted/icon-button";
import { Progress } from "@/components/adapted/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/lib/theme";
import { HeaderSearchBar } from "./-header.search-bar";

// DATA ------------------------------------------------------------------------------------------------------------------------------------
const navs = [
  linkOptions({ to: "/episodes/unwatched", label: "Unwatched", icon: "icon-[lucide--eye]" }),
  linkOptions({ to: "/episodes/upcoming", label: "Upcoming", icon: "icon-[lucide--calendar]" }),
  linkOptions({ to: "/shows/top-rated", label: "Top Rated", icon: "icon-[lucide--star]" }),
  linkOptions({ to: "/shows/trending", label: "Trending", icon: "icon-[lucide--trending-up]" }),
  linkOptions({ to: "/shows/favorites", label: "Favorites", icon: "icon-[lucide--heart]" }),
];

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const HEADER = {
  aside: cva("flex items-center gap-2"),
  base: cva("glass sticky top-0 z-50 w-full px-2 py-4 sm:px-4"),
  container: cva("container mx-auto flex justify-between"),
  main: cva("flex items-center gap-2"),
  nav: cva("hover:text-primary"),
  navs: cva("flex items-center gap-1"),
  progress: cva("fixed inset-x-0 top-0 z-50"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export default function Header() {
  return (
    <header className={HEADER.base()}>
      <HeaderProgress />
      <div className={HEADER.container()}>
        <div className={HEADER.main()}>
          <HeaderLogo />
          <Separator orientation="vertical" />
          <HeaderNavs />
        </div>
        <div className={HEADER.aside()}>
          <HeaderSearchBar />
          <HeaderThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

// LOGO ------------------------------------------------------------------------------------------------------------------------------------
const LOGO = {
  base: cva("flex gap-2 pl-1 transition-colors hover:text-primary"),
  icon: cva("icon-[lucide--tv] size-7 text-primary drop-shadow-md"),
  me: cva("text-primary"),
  title: cva("hidden font-bold text-xl tracking-tight sm:flex"),
};

function HeaderLogo() {
  return (
    <Link className={LOGO.base()} to="/">
      <span className={LOGO.icon()} />
      <h1 className={LOGO.title()}>
        Show<span className={LOGO.me()}>Me</span>
      </h1>
    </Link>
  );
}

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
function HeaderNavs() {
  return (
    <nav className={HEADER.navs()}>
      {navs.map(({ to, ...r }) => (
        <IconButton
          {...r}
          className={HEADER.nav()}
          key={to}
          nativeButton={false}
          render={<Link activeProps={{ className: "text-primary" }} to={to} />}
          variant="ghost"
        />
      ))}
    </nav>
  );
}

// PROGRESS --------------------------------------------------------------------------------------------------------------------------------
function HeaderProgress() {
  const { data } = useQuery({
    ...convexQuery(api.fetcher.read),
    select: (fetcher) => ({ created: fetcher?.created ?? 0, isPending: fetcher?.isPending ?? true }),
  });

  useEffect(() => {
    if (data && !data.isPending && data.created > 0) toast.success(`${data.created} shows added successfully`);
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

function HeaderThemeSwitcher() {
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
