import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { env } from "@/env";

async function fetchMissingShows() {
  console.log("fetchingMissingShows...");
  const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
  try {
    await client.mutation(api.shows.fetchManyMissing);
  } catch (error) {
    console.error("SEED DATA FAILED", error);
  }
}
fetchMissingShows();

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
