import type { GenericId as ConvexGenericId } from "convex/values";
import { Option as O, Schema as S, type SchemaAST } from "effect";

const ConvexId = Symbol.for("ConvexId");

export const sId = <TN extends string>(tableName: TN) =>
  S.String.annotate({ [ConvexId]: tableName }) as S.Codec<ConvexGenericId<TN>, ConvexGenericId<TN>, never, never>;

export const getTableName = <TN extends string>(ast: SchemaAST.AST): O.Option<TN> =>
  O.fromNullishOr((ast as { annotations?: Record<PropertyKey, unknown> }).annotations?.[ConvexId] as TN | undefined);
