import { ConvexError } from "convex/values";
import { Cause, Effect as E, Exit, type Layer, Result, Schema as S } from "effect";
import { EffexError } from "./errors";
import { ActionCtx } from "./services/ActionCtx";
import { MutationCtx } from "./services/MutationCtx";
import { QueryCtx } from "./services/QueryCtx";

const functionHandler =
  <C, EC>(layer: (ctx: C) => Layer.Layer<EC>) =>
  <AT, AE, RT, RE>({ args, handler, returns }: FunctionHandlerArgs<AT, AE, RT, RE, EC>) => {
    return async (ctx: C, convexArgs: AE) => {
      const program = E.gen(function* () {
        const decodedArgs = yield* S.decodeEffect(args)(convexArgs);
        const result = yield* handler(decodedArgs).pipe(E.provide(layer(ctx)));
        return yield* S.encodeEffect(returns)(result);
      });

      const exit = await E.runPromiseExit(program);

      if (Exit.isSuccess(exit)) return exit.value;

      const fail = Cause.findFail(exit.cause);
      if (Result.isSuccess(fail)) {
        if (fail.success.error instanceof EffexError) throw new ConvexError(fail.success.error.message);
        throw fail.success.error;
      }

      const defect = Cause.findDie(exit.cause);
      if (Result.isSuccess(defect)) {
        if (defect.success.defect instanceof EffexError) throw new ConvexError(defect.success.defect.message);
        throw defect.success.defect;
      }

      console.error("[effex] Encountered unknown error cause:", exit.cause);
      throw exit.cause;
    };
  };
type FunctionHandlerArgs<AT, AE, RT, RE, C> = {
  args: S.Codec<AT, AE, never, never>;
  handler: (args: AT) => E.Effect<RT, unknown, C>;
  returns: S.Codec<RT, RE, never, never>;
};

export const actionHandler = functionHandler(ActionCtx.layer);
export const mutationHandler = functionHandler(MutationCtx.layer);
export const queryHandler = functionHandler(QueryCtx.layer);
