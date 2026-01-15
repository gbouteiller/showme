import { Effect as E, Option as O } from "effect";
import type { MutationCtx, QueryCtx } from "@/convex/confect";
import type { Fetchers } from "@/schemas/fetcher";

// READ ------------------------------------------------------------------------------------------------------------------------------------
export function readFetcher(db: Pick<QueryCtx["db"], "query">) {
  return () => db.query("fetcher").unique();
}

export function readFetcherOrThrow(db: Pick<QueryCtx["db"], "query">) {
  return () => E.map(readFetcher(db)(), O.getOrThrow);
}

// UPDATE ------------------------------------------------------------------------------------------------------------------------------------
export function startFetcher(db: MutationCtx["db"]) {
  return () =>
    E.gen(function* () {
      const fetcher = yield* readFetcher(db)();
      const args = { created: 0, isPending: true, lastUpdated: Date.now() };
      if (O.isNone(fetcher)) {
        yield* db.insert("fetcher", { ...args, lastPage: 0 });
        return 0;
      }
      yield* db.patch(fetcher.value._id, args);
      return fetcher.value.lastPage;
    });
}

export function updateFetcher(db: MutationCtx["db"]) {
  return (args: (fetcher: Fetchers["Doc"]) => Partial<Fetchers["Fields"]>) =>
    E.gen(function* () {
      const fetcher = yield* readFetcherOrThrow(db)();
      yield* db.patch(fetcher._id, args(fetcher));
      return null;
    });
}
