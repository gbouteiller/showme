import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import ConvexProvider from "../integrations/convex/provider";
import appCss from "../styles.css?url";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "ShowMe" }],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexProvider>{children}</ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
type RootDocumentProps = { children: React.ReactNode };
