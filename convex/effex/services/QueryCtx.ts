import { Effect as E, Layer, ServiceMap } from "effect";
import type { QueryCtx as QueryCtx_ } from "@/convex/_generated/server";
import { Auth } from "./Auth";
import { DatabaseReader } from "./DatabaseReader";
import { Helpers } from "./Helpers";
import { StorageReader } from "./StorageReader";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexQueryCtx extends ServiceMap.Service<ConvexQueryCtx, QueryCtx_>()("ConvexQueryCtx") {
  static readonly layer = (queryCtx: QueryCtx_) => Layer.succeed(this, queryCtx);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class QueryCtx extends ServiceMap.Service<QueryCtx>()("QueryCtx", {
  make: E.gen(function* () {
    const auth = yield* Auth;
    const db = yield* DatabaseReader;
    const storage = yield* StorageReader;
    return { auth, db, storage };
  }),
}) {
  static readonly layer = (ctx: QueryCtx_) =>
    Layer.effect(this, this.make).pipe(
      Layer.provideMerge(ConvexQueryCtx.layer(ctx)),
      Layer.provideMerge(Auth.layer(ctx.auth)),
      Layer.provideMerge(DatabaseReader.layer(ctx.db)),
      Layer.provideMerge(StorageReader.layer(ctx.storage)),
      Layer.provideMerge(Helpers.layer)
    );
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type QueryCtxDeps = Layer.Success<ReturnType<typeof QueryCtx.layer>>;
