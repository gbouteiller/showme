import { ConvexError } from "convex/values";
import { Cause, Effect as E, Exit, type Layer, Schema as S } from "effect";
import { EffexError } from "./errors";
import { ActionCtx } from "./services/ActionCtx";
import { MutationCtx } from "./services/MutationCtx";
import { QueryCtx } from "./services/QueryCtx";

// FUNCTIONS -------------------------------------------------------------------------------------------------------------------------------
const functionHandler =
  <C, EC>(layer: (ctx: C) => Layer.Layer<EC>) =>
  <A, EA, R, ER>({ args, handler, returns }: FunctionHandlerProps<A, EA, R, ER, EC>) => {
    return async (ctx: C, convexArgs: A) => {
      const exit = await E.gen(function* () {
        const decodedArgs = yield* S.decode(args)(convexArgs);
        const result = yield* handler(decodedArgs).pipe(E.provide(layer(ctx)));
        return yield* S.encode(returns)(result);
      }).pipe(E.runPromiseExit);

      if (Exit.isSuccess(exit)) return exit.value;

      if (Cause.isFailType(exit.cause)) {
        if (exit.cause.error instanceof EffexError) throw new ConvexError(exit.cause.error.message);
        throw exit.cause.error;
      }

      if (Cause.isDieType(exit.cause)) {
        if (exit.cause.defect instanceof EffexError) throw new ConvexError(exit.cause.defect.message);
        throw exit.cause.defect;
      }

      console.error("[effex] Encountered unknown error cause type:", exit.cause[Cause.CauseTypeId]);
      console.error("[effex] You should catch this cause type yourself if you want a better error message.");
      throw exit.cause;
    };
  };
type FunctionHandlerProps<A, EA, R, ER, C> = {
  args: S.Schema<EA, A>;
  handler: (args: EA) => E.Effect<ER, unknown, C>;
  returns: S.Schema<ER, R>;
};

export const actionHandler = functionHandler(ActionCtx.Live);
export const mutationHandler = functionHandler(MutationCtx.Live);
export const queryHandler = functionHandler(QueryCtx.Live);
