import { createFileRoute } from "@tanstack/react-router";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/")({ component: IndexPage });

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function IndexPage() {
  return <div />;
}
