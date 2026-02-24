import { Context, Effect as E, Layer } from "effect";
import type { MutationCtx as MutationCtx_ } from "@/convex/_generated/server";
import { Auth } from "./Auth";
import { DatabaseWriter } from "./DatabaseWriter";
import { Helpers } from "./Helpers";
import { Scheduler } from "./Scheduler";
import { StorageWriter } from "./StorageWriter";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexMutationCtx extends Context.Tag("ConvexMutationCtx")<ConvexMutationCtx, MutationCtx_>() {
  static readonly Live = (ctx: MutationCtx_) => Layer.succeed(this, ctx);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const auth = yield* Auth;
  const db = yield* DatabaseWriter;
  const scheduler = yield* Scheduler;
  const storage = yield* StorageWriter;
  return { auth, db, scheduler, storage };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class MutationCtx extends Context.Tag("MutationCtx")<MutationCtx, E.Effect.Success<typeof make>>() {
  static readonly Live = (ctx: MutationCtx_) =>
    Layer.effect(this, make).pipe(
      Layer.provideMerge(ConvexMutationCtx.Live(ctx)),
      Layer.provideMerge(Auth.Live(ctx.auth)),
      Layer.provideMerge(DatabaseWriter.Live(ctx.db)),
      Layer.provideMerge(Scheduler.Live(ctx.scheduler)),
      Layer.provideMerge(StorageWriter.Live(ctx.storage)),
      Layer.provideMerge(Helpers.Live)
    );
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type MutationCtxDeps = Layer.Layer.Success<ReturnType<typeof MutationCtx.Live>>;
