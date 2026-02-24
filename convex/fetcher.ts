import { Schema as S } from "effect";
import { readFetcher, startFetcher, updateFetcher } from "@/functions/fetcher";
import { sFetcherDoc, sFetcherFields } from "@/schemas/fetcher";
import { mutation, query } from "./_generated/server";
import { mutationHandler, queryHandler } from "./effex";

// QUERY -----------------------------------------------------------------------------------------------------------------------------------
export const read = query(
  queryHandler({
    args: S.Struct({}),
    returns: S.OptionFromNullOr(sFetcherDoc),
    handler: readFetcher,
  })
);

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const stop = mutation(
  mutationHandler({
    args: S.Struct({}),
    returns: S.Null,
    handler: () => updateFetcher(() => ({ isPending: false })),
  })
);

export const start = mutation(
  mutationHandler({
    args: S.Struct({}),
    returns: S.Number,
    handler: () => startFetcher(),
  })
);

export const update = mutation(
  mutationHandler({
    args: sFetcherFields.pick("created", "lastPage"),
    returns: S.Null,
    handler: ({ created, lastPage }) => updateFetcher((fetcher) => ({ created: fetcher.created + created, lastPage })),
  })
);
