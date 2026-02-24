import type {
  DocumentByName,
  FunctionReference,
  FunctionReturnType,
  FunctionVisibility,
  OptionalRestArgs,
  VectorIndexNames,
  VectorSearchQuery,
} from "convex/server";
import { Context, Effect as E, Layer } from "effect";
import type { Simplify } from "effect/Types";
import type { DataModel, TableNames } from "@/convex/_generated/dataModel";
import type { ActionCtx as ActionCtx_ } from "@/convex/_generated/server";
import { Auth } from "./Auth";
import { Helpers } from "./Helpers";
import { Scheduler } from "./Scheduler";
import { StorageActionWriter } from "./StorageActionWriter";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexActionCtx extends Context.Tag("ConvexActionCtx")<ConvexActionCtx, ActionCtx_>() {
  static readonly Live = (ctx: ActionCtx_) => Layer.succeed(this, ctx);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const ctx = yield* ConvexActionCtx;
  const auth = yield* Auth;
  const scheduler = yield* Scheduler;
  const storage = yield* StorageActionWriter;

  const runQuery = <Query extends FunctionReference<"query", FunctionVisibility>>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): E.Effect<FunctionReturnType<Query>> => {
    return E.promise(() => ctx.runQuery(query, ...args));
  };

  const runMutation = <Mutation extends FunctionReference<"mutation", FunctionVisibility>>(
    mutation: Mutation,
    ...args: OptionalRestArgs<Mutation>
  ): E.Effect<FunctionReturnType<Mutation>> => {
    return E.promise(() => ctx.runMutation(mutation, ...args));
  };

  const runAction = <Action extends FunctionReference<"action", FunctionVisibility>>(
    action: Action,
    ...args: OptionalRestArgs<Action>
  ): E.Effect<FunctionReturnType<Action>> => {
    return E.promise(() => ctx.runAction(action, ...args));
  };

  const vectorSearch = <TN extends TableNames, IndexName extends VectorIndexNames<DataModel[TN]>>(
    table: TN,
    searchIndexName: IndexName,
    query: Simplify<VectorSearchQuery<DataModel[TN], IndexName>>
  ): E.Effect<DocumentByName<DataModel, TN>[]> => {
    return E.promise(() => ctx.vectorSearch(table, searchIndexName, query));
  };

  return { auth, runAction, runMutation, runQuery, scheduler, storage, vectorSearch };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class ActionCtx extends Context.Tag("ActionCtx")<ActionCtx, E.Effect.Success<typeof make>>() {
  static readonly Live = (ctx: ActionCtx_) =>
    Layer.effect(this, make).pipe(
      Layer.provideMerge(ConvexActionCtx.Live(ctx)),
      Layer.provideMerge(Auth.Live(ctx.auth)),
      Layer.provideMerge(Scheduler.Live(ctx.scheduler)),
      Layer.provideMerge(StorageActionWriter.Live(ctx.storage)),
      Layer.provideMerge(Helpers.Live)
    );
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type ActionCtxDeps = Layer.Layer.Success<ReturnType<typeof ActionCtx.Live>>;
