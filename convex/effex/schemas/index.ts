import { type GenericValidator, type OptionalProperty, type Validator, v } from "convex/values";
import { Option as O, type Schema as S, SchemaAST } from "effect";
import {
  EmptyEnumValuesError,
  EmptyFieldNameError,
  EmptyObjectKeywordError,
  EmptyRecordKeyMembersError,
  EmptyUnionMembersError,
  InvalidFieldNameCharactersError,
  InvalidRecordKeyError,
  MixedObjectAndRecordFieldsError,
  MultipleRecordKeysError,
  NonStringObjectFieldNameError,
  OptionalOnlyUndefinedError,
  OptionalRecordKeyError,
  OptionalRecordValueError,
  OptionalValueOutsideObjectFieldError,
  RecursiveSchemaError,
  ReservedFieldNameError,
  UndefinedOutsideOptionalObjectFieldError,
  UnhandledAstTagError,
  UnsupportedArrayShapeError,
  UnsupportedAstTagError,
} from "./error";
import { getTableName } from "./genericId";

const pushPath = (path: SchemaPath, segment: string): SchemaPath => [...path, segment];

type UnsupportedConvexAst = Extract<
  SchemaAST.AST,
  { _tag: "Any" | "Unknown" | "Never" | "Void" | "Symbol" | "UniqueSymbol" | "ObjectKeyword" | "TemplateLiteral" | "Declaration" }
>;

const assertNever = (value: never, path: SchemaPath): never => {
  throw new UnhandledAstTagError({ path, astTag: JSON.stringify(value) });
};

const isUnsupportedConvexAst = (ast: SchemaAST.AST): ast is UnsupportedConvexAst =>
  ast._tag === "Any" ||
  ast._tag === "Unknown" ||
  ast._tag === "Never" ||
  ast._tag === "Void" ||
  ast._tag === "Symbol" ||
  ast._tag === "UniqueSymbol" ||
  ast._tag === "ObjectKeyword" ||
  ast._tag === "TemplateLiteral" ||
  ast._tag === "Declaration";

const asNonEmptyTuple = <T>(values: readonly T[], path: SchemaPath): readonly [T, ...T[]] => {
  if (values.length === 0) throw new EmptyUnionMembersError({ path });

  return values as unknown as readonly [T, ...T[]];
};

const assertConvexFieldName = (name: string, path: SchemaPath): void => {
  if (name.length === 0) throw new EmptyFieldNameError({ path });

  if (name.startsWith("_") || name.startsWith("$")) throw new ReservedFieldNameError({ path, name });

  if (!/^[\x20-\x7E]+$/u.test(name)) throw new InvalidFieldNameCharactersError({ path, name });
};

const normalizeEncodedAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): SchemaAST.AST => {
  const encodedAst = SchemaAST.toEncoded(ast);

  if (SchemaAST.isSuspend(encodedAst)) {
    if (seen.has(encodedAst.thunk)) throw new RecursiveSchemaError({ path });

    seen.add(encodedAst.thunk);
    const resolved = normalizeEncodedAst(encodedAst.thunk(), path, seen);
    seen.delete(encodedAst.thunk);
    return resolved;
  }

  return encodedAst;
};

const toRequiredUnionMembers = (
  ast: SchemaAST.Union,
  path: SchemaPath,
  seen: Set<SuspendThunk>
): readonly [ConvexRequiredValidator, ...ConvexRequiredValidator[]] => {
  const validators = ast.types.map((member, index) => convexRequiredValidatorFromAst(member, pushPath(path, `|${index}`), seen));

  return asNonEmptyTuple(validators, path);
};

const convexOptionalValidatorFromAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): ConvexOptionalValidator => {
  if (SchemaAST.isUnion(ast)) {
    const members = ast.types.filter((member) => !SchemaAST.isUndefined(member));

    if (members.length === 0) throw new OptionalOnlyUndefinedError({ path });

    if (members.length === 1) return v.optional(convexRequiredValidatorFromAst(members[0], path, seen));

    const validators = members.map((member, index) => convexRequiredValidatorFromAst(member, pushPath(path, `|${index}`), seen));

    return v.optional(v.union(...asNonEmptyTuple(validators, path)));
  }

  return v.optional(convexRequiredValidatorFromAst(ast, path, seen));
};

const convexRecordKeyValidatorFromAst = (
  ast: SchemaAST.AST,
  path: SchemaPath,
  seen: Set<SuspendThunk>
): Validator<string, "required", string> => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (SchemaAST.isOptional(encodedAst)) throw new OptionalRecordKeyError({ path });

  if (SchemaAST.isString(encodedAst)) {
    const tableName = getTableName<string>(encodedAst);
    return O.isSome(tableName) ? v.id(tableName.value) : v.string();
  }

  if (SchemaAST.isUnion(encodedAst)) {
    const members = encodedAst.types.map((member, index) => convexRecordKeyValidatorFromAst(member, pushPath(path, `|${index}`), seen));

    if (members.length === 0) throw new EmptyRecordKeyMembersError({ path });

    if (members.length === 1) return members[0];

    return v.union(...asNonEmptyTuple(members, path));
  }

  throw new InvalidRecordKeyError({ path, astTag: encodedAst._tag });
};

const convexObjectValidatorFromAst = (ast: SchemaAST.Objects, path: SchemaPath, seen: Set<SuspendThunk>): ConvexRequiredValidator => {
  if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) throw new EmptyObjectKeywordError({ path });

  if (ast.propertySignatures.length > 0 && ast.indexSignatures.length > 0) throw new MixedObjectAndRecordFieldsError({ path });

  if (ast.indexSignatures.length > 0) {
    if (ast.indexSignatures.length !== 1) throw new MultipleRecordKeysError({ path });

    const [indexSignature] = ast.indexSignatures;

    if (SchemaAST.isOptional(indexSignature.type)) throw new OptionalRecordValueError({ path });

    return v.record(
      convexRecordKeyValidatorFromAst(indexSignature.parameter, pushPath(path, "<key>"), seen),
      convexRequiredValidatorFromAst(indexSignature.type, pushPath(path, "<value>"), seen)
    );
  }

  const fields: Record<string, ConvexValueValidator> = {};

  for (const propertySignature of ast.propertySignatures) {
    if (typeof propertySignature.name !== "string") throw new NonStringObjectFieldNameError({ path });

    const fieldPath = pushPath(path, propertySignature.name);
    assertConvexFieldName(propertySignature.name, fieldPath);
    fields[propertySignature.name] = convexValidatorFromAst(propertySignature.type, fieldPath, true, seen);
  }

  return v.object(fields);
};

const convexEnumValidatorFromAst = (ast: SchemaAST.Enum, path: SchemaPath): ConvexRequiredValidator => {
  const values = [...new Set(ast.enums.map(([, value]) => value))];

  if (values.length === 0) throw new EmptyEnumValuesError({ path });

  if (values.length === 1) return v.literal(values[0]);

  const members = values.map((value) => v.literal(value));
  return v.union(...asNonEmptyTuple(members, path));
};

const convexRequiredValidatorFromAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): ConvexRequiredValidator => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (isUnsupportedConvexAst(encodedAst)) {
    throw new UnsupportedAstTagError({ path, astTag: encodedAst._tag });
  }

  switch (encodedAst._tag) {
    case "String": {
      const tableName = getTableName<string>(encodedAst);
      return O.isSome(tableName) ? v.id(tableName.value) : v.string();
    }
    case "Number":
      return v.number();
    case "BigInt":
      return v.int64();
    case "Boolean":
      return v.boolean();
    case "Null":
      return v.null();
    case "Literal":
      return v.literal(encodedAst.literal);
    case "Enum":
      return convexEnumValidatorFromAst(encodedAst, path);
    case "Arrays":
      if (encodedAst.elements.length > 0 || encodedAst.rest.length !== 1) {
        throw new UnsupportedArrayShapeError({ path });
      }

      return v.array(convexRequiredValidatorFromAst(encodedAst.rest[0], pushPath(path, "[]"), seen));
    case "Objects":
      return convexObjectValidatorFromAst(encodedAst, path, seen);
    case "Union": {
      const members = toRequiredUnionMembers(encodedAst, path, seen);
      return members.length === 1 ? members[0] : v.union(...members);
    }
    case "Undefined":
      throw new UndefinedOutsideOptionalObjectFieldError({ path });
    case "Suspend":
      throw new RecursiveSchemaError({ path });
    default:
      return assertNever(encodedAst, path);
  }
};

const convexValidatorFromAst = (
  ast: SchemaAST.AST,
  path: SchemaPath,
  allowOptional: boolean,
  seen: Set<SuspendThunk>
): ConvexValueValidator => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (SchemaAST.isOptional(encodedAst)) {
    if (!allowOptional) throw new OptionalValueOutsideObjectFieldError({ path });

    return convexOptionalValidatorFromAst(encodedAst, path, seen);
  }

  return convexRequiredValidatorFromAst(encodedAst, path, seen);
};

export const convexSchemaFrom = <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>): ConvexSchemaFromFields<Fields> => {
  const validators: Record<string, GenericValidator> = {};

  for (const key of Reflect.ownKeys(schema.fields)) {
    if (typeof key !== "string") throw new NonStringObjectFieldNameError({ path: [] });

    const field = schema.fields[key as keyof Fields];
    const fieldPath = [key];

    assertConvexFieldName(key, fieldPath);
    validators[key] = convexValidatorFromAst(field.ast, fieldPath, true, new Set());
  }

  return validators as ConvexSchemaFromFields<Fields>;
};

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type ConvexOptionalityFromSchema<Schema extends S.Top> = Schema["~encoded.optionality"] extends "optional" ? "optional" : "required";

type ConvexCompatibleValue<Value> = Value extends ArrayBuffer
  ? Value
  : Value extends ReadonlyArray<infer Item>
    ? ConvexCompatibleValue<Item>[]
    : Value extends object
      ? { -readonly [K in keyof Value]: ConvexCompatibleValue<Value[K]> }
      : Value;

type ConvexFieldValidatorFromSchema<Schema extends S.Top> = Validator<
  ConvexCompatibleValue<S.Codec.Encoded<Schema>>,
  ConvexOptionalityFromSchema<Schema>
>;

export type ConvexSchemaFromFields<Fields extends S.Struct.Fields> = {
  [K in keyof Fields]: ConvexFieldValidatorFromSchema<Fields[K]>;
};

type ConvexRequiredValidator = Validator<unknown, "required", string>;
type ConvexOptionalValidator = Validator<unknown, "optional", string>;
type ConvexValueValidator = Validator<unknown, OptionalProperty, string>;
type SuspendThunk = SchemaAST.Suspend["thunk"];
type SchemaPath = readonly string[];
