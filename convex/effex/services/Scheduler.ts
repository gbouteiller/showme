import type { OptionalRestArgs, SchedulableFunctionReference, Scheduler as Scheduler_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Effect as E, Layer, ServiceMap } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexScheduler extends ServiceMap.Service<ConvexScheduler, Scheduler_>()("ConvexScheduler") {
  static readonly layer = (scheduler: Scheduler_) => Layer.succeed(this, scheduler);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class Scheduler extends ServiceMap.Service<Scheduler>()("Scheduler", {
  make: E.gen(function* () {
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
  }),
}) {
  static readonly layer = (scheduler: Scheduler_) => Layer.effect(this, this.make).pipe(Layer.provide(ConvexScheduler.layer(scheduler)));
}
