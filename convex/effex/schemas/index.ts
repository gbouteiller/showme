import { type GenericValidator, type OptionalProperty, type Validator, v } from "convex/values";
import { Option as O, type Schema as S, SchemaAST } from "effect";
import { getTableName } from "./genericId";

const convexSchemaError = (path: SchemaPath, message: string): Error =>
  new Error(`Unsupported Convex schema at ${formatPath(path)}: ${message}`);

const formatPath = (path: SchemaPath): string => (path.length === 0 ? "<root>" : path.join("."));

const pushPath = (path: SchemaPath, segment: string): SchemaPath => [...path, segment];

const asNonEmptyTuple = <T>(values: readonly T[], path: SchemaPath, message: string): readonly [T, ...T[]] => {
  if (values.length === 0) throw convexSchemaError(path, message);

  return values as unknown as readonly [T, ...T[]];
};

const assertConvexFieldName = (name: string, path: SchemaPath): void => {
  if (name.length === 0) throw convexSchemaError(path, "field names must be non-empty strings");

  if (name.startsWith("_") || name.startsWith("$"))
    throw convexSchemaError(path, `field name ${JSON.stringify(name)} cannot start with "_" or "$"`);

  if (!/^[\x20-\x7E]+$/u.test(name))
    throw convexSchemaError(path, `field name ${JSON.stringify(name)} must use non-control ASCII characters only`);
};

const normalizeEncodedAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): SchemaAST.AST => {
  const encodedAst = SchemaAST.toEncoded(ast);

  if (SchemaAST.isSuspend(encodedAst)) {
    if (seen.has(encodedAst.thunk)) throw convexSchemaError(path, "recursive schemas are not supported by Convex validators");

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

  return asNonEmptyTuple(validators, path, "unions must contain at least one supported member");
};

const convexOptionalValidatorFromAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): ConvexOptionalValidator => {
  if (SchemaAST.isUnion(ast)) {
    const members = ast.types.filter((member) => !SchemaAST.isUndefined(member));

    if (members.length === 0) throw convexSchemaError(path, "optional fields cannot encode to only undefined");

    if (members.length === 1) return v.optional(convexRequiredValidatorFromAst(members[0], path, seen));

    const validators = members.map((member, index) => convexRequiredValidatorFromAst(member, pushPath(path, `|${index}`), seen));

    return v.optional(v.union(...asNonEmptyTuple(validators, path, "optional unions must contain a value member")));
  }

  return v.optional(convexRequiredValidatorFromAst(ast, path, seen));
};

const convexRecordKeyValidatorFromAst = (
  ast: SchemaAST.AST,
  path: SchemaPath,
  seen: Set<SuspendThunk>
): Validator<string, "required", string> => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (SchemaAST.isOptional(encodedAst)) throw convexSchemaError(path, "record keys cannot be optional");

  if (SchemaAST.isString(encodedAst)) {
    const tableName = getTableName<string>(encodedAst);
    return O.isSome(tableName) ? v.id(tableName.value) : v.string();
  }

  if (SchemaAST.isUnion(encodedAst)) {
    const members = encodedAst.types.map((member, index) => convexRecordKeyValidatorFromAst(member, pushPath(path, `|${index}`), seen));

    if (members.length === 0) throw convexSchemaError(path, "record keys must contain at least one supported member");

    if (members.length === 1) return members[0];

    return v.union(...asNonEmptyTuple(members, path, "record key unions must contain at least one member"));
  }

  throw convexSchemaError(path, `record keys must be string-like Convex validators, received ${encodedAst._tag}`);
};

const convexObjectValidatorFromAst = (ast: SchemaAST.Objects, path: SchemaPath, seen: Set<SuspendThunk>): ConvexRequiredValidator => {
  if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0)
    throw convexSchemaError(path, "empty object keywords are broader than Convex objects and cannot be converted safely");

  if (ast.propertySignatures.length > 0 && ast.indexSignatures.length > 0)
    throw convexSchemaError(path, "mixed fixed fields and record fields are not supported by Convex validators");

  if (ast.indexSignatures.length > 0) {
    if (ast.indexSignatures.length !== 1) throw convexSchemaError(path, "Convex records support a single record key validator");

    const [indexSignature] = ast.indexSignatures;

    if (SchemaAST.isOptional(indexSignature.type)) throw convexSchemaError(path, "record values cannot be optional");

    return v.record(
      convexRecordKeyValidatorFromAst(indexSignature.parameter, pushPath(path, "<key>"), seen),
      convexRequiredValidatorFromAst(indexSignature.type, pushPath(path, "<value>"), seen)
    );
  }

  const fields: Record<string, ConvexValueValidator> = {};

  for (const propertySignature of ast.propertySignatures) {
    if (typeof propertySignature.name !== "string") throw convexSchemaError(path, "Convex object field names must be strings");

    const fieldPath = pushPath(path, propertySignature.name);
    assertConvexFieldName(propertySignature.name, fieldPath);
    fields[propertySignature.name] = convexValidatorFromAst(propertySignature.type, fieldPath, true, seen);
  }

  return v.object(fields);
};

const convexEnumValidatorFromAst = (ast: SchemaAST.Enum, path: SchemaPath): ConvexRequiredValidator => {
  const values = [...new Set(ast.enums.map(([, value]) => value))];

  if (values.length === 0) throw convexSchemaError(path, "enums must contain at least one literal value");

  if (values.length === 1) return v.literal(values[0]);

  const members = values.map((value) => v.literal(value));
  return v.union(...asNonEmptyTuple(members, path, "enums must contain at least one literal value"));
};

const convexRequiredValidatorFromAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): ConvexRequiredValidator => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

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
        throw convexSchemaError(path, "Convex arrays must be homogeneous; tuples and rest tuples are unsupported");
      }

      return v.array(convexRequiredValidatorFromAst(encodedAst.rest[0], pushPath(path, "[]"), seen));
    case "Objects":
      return convexObjectValidatorFromAst(encodedAst, path, seen);
    case "Union": {
      const members = toRequiredUnionMembers(encodedAst, path, seen);
      return members.length === 1 ? members[0] : v.union(...members);
    }
    case "Undefined":
      throw convexSchemaError(path, "undefined is only supported through optional object fields");
    case "Any":
    case "Unknown":
      throw convexSchemaError(path, `${encodedAst._tag} cannot be converted without losing type safety`);
    case "Never":
      throw convexSchemaError(path, "never cannot be represented by a Convex validator");
    case "Void":
      throw convexSchemaError(path, "void cannot be stored in Convex documents");
    case "Symbol":
    case "UniqueSymbol":
      throw convexSchemaError(path, "symbols are not supported by Convex");
    case "ObjectKeyword":
      throw convexSchemaError(path, "generic object keywords are broader than Convex object validators");
    case "TemplateLiteral":
      throw convexSchemaError(path, "template literal constraints cannot be represented by Convex validators");
    case "Declaration":
      throw convexSchemaError(path, "custom declarations must encode to supported Convex primitives before conversion");
    case "Suspend":
      throw convexSchemaError(path, "recursive schemas are not supported by Convex validators");
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
    if (!allowOptional) throw convexSchemaError(path, "optional values are only supported on object fields");

    return convexOptionalValidatorFromAst(encodedAst, path, seen);
  }

  return convexRequiredValidatorFromAst(encodedAst, path, seen);
};

export const convexSchemaFrom = <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>): ConvexSchemaFromFields<Fields> => {
  const validators: Record<string, GenericValidator> = {};

  for (const key of Reflect.ownKeys(schema.fields)) {
    if (typeof key !== "string") throw convexSchemaError([], "Convex schema field names must be strings");

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
