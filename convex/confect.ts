import {
  ConfectActionCtx,
  type ConfectDataModelFromConfectSchemaDefinition,
  type ConfectDoc,
  ConfectMutationCtx,
  ConfectQueryCtx,
  makeFunctions,
  type TableNamesInConfectDataModel,
} from "@rjdellecese/confect/server";
import { schema } from "./schema";

// CONST -----------------------------------------------------------------------------------------------------------------------------------
export const { action, internalAction, internalMutation, internalQuery, mutation, query } = makeFunctions(schema);
export const ActionCtx = ConfectActionCtx<DataModel>();
export const MutationCtx = ConfectMutationCtx<DataModel>();
export const QueryCtx = ConfectQueryCtx<DataModel>();

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type ActionCtx = ConfectActionCtx<DataModel>;
export type DataModel = ConfectDataModelFromConfectSchemaDefinition<Schema>;
export type Doc<TableName extends TableNamesInConfectDataModel<DataModel>> = ConfectDoc<DataModel, TableName>;
export type QueryCtx = ConfectQueryCtx<DataModel>;
export type MutationCtx = ConfectMutationCtx<DataModel>;
export type Schema = typeof schema;
