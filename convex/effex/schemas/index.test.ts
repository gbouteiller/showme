import type { OptionalProperty, Validator } from "convex/values";
import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";
import {
  InvalidFieldNameCharactersError,
  MixedObjectAndRecordFieldsError,
  OptionalRecordValueError,
  RecursiveSchemaError,
  ReservedFieldNameError,
  UndefinedOutsideOptionalObjectFieldError,
  UnhandledAstTagError,
  UnsupportedArrayShapeError,
} from "./errors";
import { sId } from "./genericId";
import { convexSchemaFrom } from "./index";

const validatorJson = (validator: Validator<unknown, OptionalProperty, string>) =>
  (validator as unknown as { readonly json: Record<string, unknown> }).json;

const schemaJson = (schema: Record<string, Validator<unknown, OptionalProperty, string>>) =>
  Object.fromEntries(Object.entries(schema).map(([key, validator]) => [key, validatorJson(validator)]));

describe("convexSchemaFrom", () => {
  it("converts supported encoded Effect schema shapes into Convex validators", () => {
    const Status = {
      Draft: "draft",
      Published: "published",
    } as const;

    const SingleValue = {
      Only: "only",
      Duplicate: "only",
    } as const;

    const schema = S.Struct({
      arrayValue: S.Array(S.String),
      bigintValue: S.BigInt,
      booleanValue: S.Boolean,
      enumValue: S.Enum(Status),
      idValue: sId("shows"),
      literalValue: S.Literal("fixed"),
      nestedValue: S.Struct({
        child: S.Boolean,
        maybeChild: S.optional(S.Number),
      }),
      nullOrValue: S.NullOr(S.String),
      nullValue: S.Null,
      numberValue: S.Number,
      optionFromNullOrValue: S.OptionFromNullOr(sId("episodes")),
      optionalValue: S.optional(S.Number),
      recordValue: S.Record(S.String, S.Boolean),
      singleEnumValue: S.Enum(SingleValue),
      stringValue: S.String,
      unionValue: S.Union([S.String, S.Number]),
    });

    expect(schemaJson(convexSchemaFrom(schema))).toEqual({
      arrayValue: {
        type: "array",
        value: { type: "string" },
      },
      bigintValue: { type: "bigint" },
      booleanValue: { type: "boolean" },
      enumValue: {
        type: "union",
        value: [
          { type: "literal", value: "draft" },
          { type: "literal", value: "published" },
        ],
      },
      idValue: { tableName: "shows", type: "id" },
      literalValue: { type: "literal", value: "fixed" },
      nestedValue: {
        type: "object",
        value: {
          child: { fieldType: { type: "boolean" }, optional: false },
          maybeChild: { fieldType: { type: "number" }, optional: true },
        },
      },
      nullOrValue: {
        type: "union",
        value: [{ type: "string" }, { type: "null" }],
      },
      nullValue: { type: "null" },
      numberValue: { type: "number" },
      optionFromNullOrValue: {
        type: "union",
        value: [{ tableName: "episodes", type: "id" }, { type: "null" }],
      },
      optionalValue: { type: "number" },
      recordValue: {
        keys: { type: "string" },
        type: "record",
        values: { fieldType: { type: "boolean" }, optional: false },
      },
      singleEnumValue: { type: "literal", value: "only" },
      stringValue: { type: "string" },
      unionValue: {
        type: "union",
        value: [{ type: "string" }, { type: "number" }],
      },
    });
  });

  it("rejects tuple-like array schemas", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          tupleValue: S.Tuple([S.String, S.Number]),
        })
      )
    ).toThrowError(UnsupportedArrayShapeError);
  });

  it("encodes nested optional values through their encoded undefined union", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          arrayValue: S.Array(S.optional(S.String)),
        })
      )
    ).toThrowError(UndefinedOutsideOptionalObjectFieldError);
  });

  it("rejects undefined unions outside optional object fields", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          undefinedOrValue: S.UndefinedOr(S.String),
        })
      )
    ).toThrowError(UndefinedOutsideOptionalObjectFieldError);
  });

  it("rejects optional record values", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          recordValue: S.Record(S.String, S.optional(S.Number)),
        })
      )
    ).toThrowError(OptionalRecordValueError);
  });

  it("rejects mixed object and record schemas", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          mixedValue: S.StructWithRest(S.Struct({ fixed: S.String }), [S.Record(S.String, S.Number)]),
        })
      )
    ).toThrowError(MixedObjectAndRecordFieldsError);
  });

  it("rejects recursive suspended schemas", () => {
    let tree!: S.Top;

    tree = S.Struct({
      children: S.Array(S.suspend(() => tree)),
    });

    expect(() =>
      convexSchemaFrom(
        S.Struct({
          tree,
        })
      )
    ).toThrowError(RecursiveSchemaError);
  });

  it("rejects unsupported encoded AST tags", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          templateValue: S.TemplateLiteral(["show-", S.String]),
        })
      )
    ).toThrowError(UnhandledAstTagError);
  });

  it("reports the full path for nested reserved field names", () => {
    try {
      convexSchemaFrom(
        S.Struct({
          outer: S.Struct({
            _bad: S.String,
          }),
        })
      );

      throw new Error("Expected convexSchemaFrom to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ReservedFieldNameError);
      expect((error as { readonly path: readonly string[] }).path).toEqual(["outer", "_bad"]);
    }
  });

  it("reports the full path for nested invalid field names", () => {
    try {
      convexSchemaFrom(
        S.Struct({
          outer: S.Struct({
            "bad\nname": S.String,
          }),
        })
      );

      throw new Error("Expected convexSchemaFrom to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidFieldNameCharactersError);
      expect((error as { readonly path: readonly string[] }).path).toEqual(["outer", "bad\nname"]);
    }
  });

  it("rejects reserved Convex field names", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          _id: S.String,
        })
      )
    ).toThrowError(ReservedFieldNameError);
  });

  it("rejects non-ascii-control-safe Convex field names", () => {
    expect(() =>
      convexSchemaFrom(
        S.Struct({
          "bad\nname": S.String,
        })
      )
    ).toThrowError(InvalidFieldNameCharactersError);
  });
});
