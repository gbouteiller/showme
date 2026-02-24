import type { GenericId as ConvexGenericId } from "convex/values";
import { type Option as O, Schema as S, SchemaAST } from "effect";

const ConvexId = Symbol.for("ConvexId");

export const sId = <TN extends string>(tableName: TN): S.Schema<ConvexGenericId<TN>> =>
  S.String.pipe(S.annotations({ [ConvexId]: tableName })) as unknown as S.Schema<ConvexGenericId<TN>>;

export type GenericId<TN extends string> = ConvexGenericId<TN>;

export const getTableName = <TN extends string>(ast: SchemaAST.AST): O.Option<TN> => SchemaAST.getAnnotation<TN>(ConvexId)(ast);
