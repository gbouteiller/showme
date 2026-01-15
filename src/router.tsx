import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider } from "convex/react";
import { api } from "@/convex/_generated/api";
import { env } from "./env";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL);
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  convexQueryClient.convexClient.mutation(api.shows.fetchManyMissing).catch((error) => {
    console.error("SEED DATA FAILED", error);
  });

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: { convexQueryClient, queryClient },
    scrollRestoration: true,
    Wrap: ({ children }) => <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
