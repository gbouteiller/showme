import { Data } from "effect";

export class EffexError extends Data.TaggedError("EffexError") {}

export class DocNotFoundInTable<T extends string> extends Data.TaggedError("DocNotFoundInTable")<{ table: T }> {
  readonly message = `No document found in table "${this.table}".`;
}

export class InvalidIdProvidedForPatch extends Data.TaggedError("InvalidIdProvidedForPatch") {
  readonly message = "Invalid id provided for patch.";
}

export class AggregateAtError extends Data.TaggedError("AggregateAtError")<{ cause: unknown; offset: number }> {
  readonly message = `Failed to get document at offset ${this.offset}.`;
}

export class AggregateCountError extends Data.TaggedError("AggregateCountError")<{ cause: unknown }> {
  readonly message = "Failed to count documents.";
}

export class AggregatePaginateError extends Data.TaggedError("AggregatePaginateError")<{ cause: unknown }> {
  readonly message = "Failed to paginate documents.";
}
