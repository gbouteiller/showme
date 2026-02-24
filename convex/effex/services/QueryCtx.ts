import { Context, Effect as E, Layer } from "effect";
import type { QueryCtx as QueryCtx_ } from "@/convex/_generated/server";
import { Auth } from "./Auth";
import { DatabaseReader } from "./DatabaseReader";
import { Helpers } from "./Helpers";
import { StorageReader } from "./StorageReader";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexQueryCtx extends Context.Tag("ConvexQueryCtx")<ConvexQueryCtx, QueryCtx_>() {
  static readonly Live = (queryCtx: QueryCtx_) => Layer.succeed(this, queryCtx);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const auth = yield* Auth;
  const db = yield* DatabaseReader;
  const storage = yield* StorageReader;
  return { auth, db, storage };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class QueryCtx extends Context.Tag("QueryCtx")<QueryCtx, E.Effect.Success<typeof make>>() {
  static readonly Live = (ctx: QueryCtx_) =>
    Layer.effect(this, make).pipe(
      Layer.provideMerge(ConvexQueryCtx.Live(ctx)),
      Layer.provideMerge(Auth.Live(ctx.auth)),
      Layer.provideMerge(DatabaseReader.Live(ctx.db)),
      Layer.provideMerge(StorageReader.Live(ctx.storage)),
      Layer.provideMerge(Helpers.Live)
    );
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type QueryCtxDeps = Layer.Layer.Success<ReturnType<typeof QueryCtx.Live>>;
