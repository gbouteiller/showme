import { Effect as E, Option as O } from "effect";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import type { Fetchers } from "@/schemas/fetcher";

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const readFetcher = E.fn(function* () {
  const db = yield* DatabaseReader;
  return yield* db.query("fetcher").unique();
});

export const readFetcherOrThrow = () => readFetcher().pipe(E.map(O.getOrThrow));

// UPDATE ----------------------------------------------------------------------------------------------------------------------------------
export const startFetcher = E.fn(function* () {
  const db = yield* DatabaseWriter;
  const fetcher = yield* readFetcher();
  const args = { count: 0, isDone: false, isPending: true };
  if (O.isNone(fetcher)) {
    yield* db.insert("fetcher", { ...args, page: 0 });
    return 0;
  }
  yield* db.patch("fetcher", fetcher.value._id, args);
  return fetcher.value.page;
});

export const updateFetcher = E.fn(function* (args: (fetcher: Fetchers["Doc"]) => Partial<Fetchers["Fields"]>) {
  const db = yield* DatabaseWriter;
  const fetcher = yield* readFetcherOrThrow();
  yield* db.patch("fetcher", fetcher._id, args(fetcher));
  return null;
});
