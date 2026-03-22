import { Effect as E, Layer, ServiceMap } from "effect";
import type { MutationCtx as MutationCtx_ } from "@/convex/_generated/server";
import { Auth } from "./Auth";
import { DatabaseWriter } from "./DatabaseWriter";
import { Helpers } from "./Helpers";
import { Scheduler } from "./Scheduler";
import { StorageWriter } from "./StorageWriter";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexMutationCtx extends ServiceMap.Service<ConvexMutationCtx, MutationCtx_>()("ConvexMutationCtx") {
  static readonly layer = (ctx: MutationCtx_) => Layer.succeed(this, ctx);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class MutationCtx extends ServiceMap.Service<MutationCtx>()("MutationCtx", {
  make: E.gen(function* () {
    const auth = yield* Auth;
    const db = yield* DatabaseWriter;
    const scheduler = yield* Scheduler;
    const storage = yield* StorageWriter;
    return { auth, db, scheduler, storage };
  }),
}) {
  static readonly layer = (ctx: MutationCtx_) =>
    Layer.effect(this, this.make).pipe(
      Layer.provideMerge(ConvexMutationCtx.layer(ctx)),
      Layer.provideMerge(Auth.layer(ctx.auth)),
      Layer.provideMerge(DatabaseWriter.layer(ctx.db)),
      Layer.provideMerge(Scheduler.layer(ctx.scheduler)),
      Layer.provideMerge(StorageWriter.layer(ctx.storage)),
      Layer.provideMerge(Helpers.layer)
    );
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type MutationCtxDeps = Layer.Success<ReturnType<typeof MutationCtx.layer>>;
