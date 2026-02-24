import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import type { DataModel } from "./_generated/dataModel";
import { mutation as mutation_ } from "./_generated/server";

export const triggers = new Triggers<DataModel>();

export const mutation = customMutation(mutation_, customCtx(triggers.wrapDB));
