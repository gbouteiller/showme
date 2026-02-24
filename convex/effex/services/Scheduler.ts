import type { OptionalRestArgs, SchedulableFunctionReference, Scheduler as Scheduler_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexScheduler extends Context.Tag("ConvexScheduler")<ConvexScheduler, Scheduler_>() {
  static readonly Live = (scheduler: Scheduler_) => Layer.succeed(this, scheduler);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const scheduler = yield* ConvexScheduler;

  const cancel = (id: GenericId<"_scheduled_functions">): E.Effect<void, never, never> => {
    return E.promise(() => scheduler.cancel(id));
  };

  const runAfter = <Ref extends SchedulableFunctionReference>(
    delayMs: number,
    functionReference: SchedulableFunctionReference,
    ...args: OptionalRestArgs<Ref>
  ): E.Effect<GenericId<"_scheduled_functions">, never, never> => {
    return E.promise(() => scheduler.runAfter(delayMs, functionReference, ...args));
  };

  const runAt = <Ref extends SchedulableFunctionReference>(
    timestamp: number | Date,
    functionReference: SchedulableFunctionReference,
    ...args: OptionalRestArgs<Ref>
  ): E.Effect<GenericId<"_scheduled_functions">, never, never> => {
    return E.promise(() => scheduler.runAt(timestamp, functionReference, ...args));
  };

  return { cancel, runAfter, runAt };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class Scheduler extends Context.Tag("Scheduler")<Scheduler, E.Effect.Success<typeof make>>() {
  static readonly Live = (scheduler: Scheduler_) => Layer.effect(this, make).pipe(Layer.provide(ConvexScheduler.Live(scheduler)));
}
