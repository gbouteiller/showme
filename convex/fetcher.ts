import { Effect as E, Schema as S } from "effect";
import { readFetcher, updateFetcher } from "@/functions/fetcher";
import { sFetcherDoc, sFetcherFields } from "@/schemas/fetcher";
import { MutationCtx, mutation, QueryCtx, query } from "./confect";

// QUERY -----------------------------------------------------------------------------------------------------------------------------------
export const read = query({
  args: S.Struct({}),
  returns: S.OptionFromNullOr(sFetcherDoc),
  handler: () =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      return yield* readFetcher(db)();
    }),
});

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const stop = mutation({
  args: S.Struct({}),
  returns: S.Null,
  handler: () =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      return yield* updateFetcher(db)(() => ({ isPending: false }));
    }),
});

export const update = mutation({
  args: sFetcherFields.pick("created", "lastPage"),
  returns: S.Null,
  handler: ({ created, lastPage }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      return yield* updateFetcher(db)((fetcher) => ({ created: fetcher.created + created, lastPage }));
    }),
});
