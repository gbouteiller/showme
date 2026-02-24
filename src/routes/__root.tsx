import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/adapted/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
