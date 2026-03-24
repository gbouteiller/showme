import { Data } from "effect";

// UTILS -----------------------------------------------------------------------------------------------------------------------------------
const formatPath = (path: readonly string[]): string => (path.length === 0 ? "<root>" : path.join("."));
const formatMessage = (path: readonly string[], detail: string): string => `Unsupported Convex schema at ${formatPath(path)}: ${detail}`;

// ERRORS ----------------------------------------------------------------------------------------------------------------------------------
export class EmptyEnumValuesError extends Data.TaggedError("EmptyEnumValuesError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "enums must contain at least one literal value");
  }
}

export class EmptyFieldNameError extends Data.TaggedError("EmptyFieldNameError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "field names must be non-empty strings");
  }
}

export class EmptyObjectKeywordError extends Data.TaggedError("EmptyObjectKeywordError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "empty object keywords are broader than Convex objects and cannot be converted safely");
  }
}

export class EmptyRecordKeyMembersError extends Data.TaggedError("EmptyRecordKeyMembersError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "record keys must contain at least one supported member");
  }
}

export class EmptyUnionMembersError extends Data.TaggedError("EmptyUnionMembersError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "unions must contain at least one supported member");
  }
}

export class InvalidFieldNameCharactersError extends Data.TaggedError("InvalidFieldNameCharactersError")<WithPathAndName> {
  override get message(): string {
    return formatMessage(this.path, `field name ${JSON.stringify(this.name)} must use non-control ASCII characters only`);
  }
}

export class InvalidRecordKeyError extends Data.TaggedError("InvalidRecordKeyError")<WithPathAndAstTag> {
  override get message(): string {
    return formatMessage(this.path, `record keys must be string-like Convex validators, received ${this.astTag}`);
  }
}

export class MixedObjectAndRecordFieldsError extends Data.TaggedError("MixedObjectAndRecordFieldsError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "mixed fixed fields and record fields are not supported by Convex validators");
  }
}

export class MultipleRecordKeysError extends Data.TaggedError("MultipleRecordKeysError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "Convex records support a single record key validator");
  }
}

export class NonStringObjectFieldNameError extends Data.TaggedError("NonStringObjectFieldNameError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "Convex object field names must be strings");
  }
}

export class OptionalOnlyUndefinedError extends Data.TaggedError("OptionalOnlyUndefinedError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "optional fields cannot encode to only undefined");
  }
}

export class OptionalRecordKeyError extends Data.TaggedError("OptionalRecordKeyError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "record keys cannot be optional");
  }
}

export class OptionalRecordValueError extends Data.TaggedError("OptionalRecordValueError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "record values cannot be optional");
  }
}

export class OptionalValueOutsideObjectFieldError extends Data.TaggedError("OptionalValueOutsideObjectFieldError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "optional values are only supported on object fields");
  }
}

export class RecursiveSchemaError extends Data.TaggedError("RecursiveSchemaError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "recursive schemas are not supported by Convex validators");
  }
}

export class ReservedFieldNameError extends Data.TaggedError("ReservedFieldNameError")<WithPathAndName> {
  override get message(): string {
    return formatMessage(this.path, `field name ${JSON.stringify(this.name)} cannot start with "_" or "$"`);
  }
}

export class UndefinedOutsideOptionalObjectFieldError extends Data.TaggedError("UndefinedOutsideOptionalObjectFieldError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "undefined is only supported through optional object fields");
  }
}

export class UnhandledAstTagError extends Data.TaggedError("UnhandledAstTagError")<WithPathAndAstTag> {
  override get message(): string {
    return formatMessage(this.path, `Unhandled AST tag: ${this.astTag}`);
  }
}

export class UnsupportedArrayShapeError extends Data.TaggedError("UnsupportedArrayShapeError")<WithPath> {
  override get message(): string {
    return formatMessage(this.path, "Convex arrays must be homogeneous; tuples and rest tuples are unsupported");
  }
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type WithPath = { readonly path: readonly string[] };
type WithPathAndAstTag = WithPath & { readonly astTag: string };
type WithPathAndName = WithPath & { readonly name: string };
