import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/adapted/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/adapted/dialog";
import { Toaster } from "@/components/adapted/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { ThemeProvider } from "@/lib/theme";
import appCss from "../styles.css?url";
import Header from "./-header";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "ShowMe" }],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

// DOCUMENT --------------------------------------------------------------------------------------------------------------------------------
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 dark:to-secondary">
        <ThemeProvider>
          <TooltipProvider>
            <Header />
            <div className="container mx-auto py-8">{children}</div>
            <FirstLauncher />
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

// FIRST LAUNCHER --------------------------------------------------------------------------------------------------------------------------
function FirstLauncher() {
  const [open, setOpen] = useState(false);

  const { mutate: fetchManyMissing } = useMutation({ mutationFn: useConvexMutation(api.shows.fetchManyMissing) });
  const { data } = useQuery({
    ...convexQuery(api.fetcher.read),
    select: (data) => ({ hasItems: (data?.count ?? 0) > 0, isIncomplete: data === null || data.isDone === false }),
  });

  const handleFetch = () => {
    fetchManyMissing({});
    setOpen(false);
  };

  useEffect(() => {
    if (data?.isIncomplete) setOpen(true);
  }, [data]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data?.hasItems ? "INCOMPLETE FETCHING" : "FIRST LAUNCH"}</DialogTitle>
          <DialogDescription>Let's fetch the shows</DialogDescription>
        </DialogHeader>
        The process can be quite long, so please keep the app open until the progress bar disappears.
        <DialogFooter>
          <Button className="cursor-pointer" onClick={handleFetch}>
            FETCH NOW!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
