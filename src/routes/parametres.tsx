import { createFileRoute } from "@tanstack/react-router";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/parametres")({
  component: RouteComponent,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function RouteComponent() {
  return <div>Hello "/_authenticated/parametres"!</div>;
}
