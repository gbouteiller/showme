import { type OptionalProperty, type Validator, v } from "convex/values";
import { Array as Arr, Option as O, pipe, Record, type Schema as S, SchemaAST, Tuple } from "effect";
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
} from "./errors";
import { getTableName } from "./genericId";

// CONSTS ----------------------------------------------------------------------------------------------------------------------------------
const convexFieldNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export const convexSchemaFrom = <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>): ConvexSchemaFromFields<Fields> =>
  pipe(
    Reflect.ownKeys(schema.fields),
    Arr.map((name) => Tuple.make(assertFieldName(name), schema.fields[name].ast)),
    Record.fromEntries,
    Record.map((ast, name) => vFrom({ ast, path: [name], allowOptional: true, seen: new Set() }))
  ) as ConvexSchemaFromFields<Fields>;

// ASSERTIONS ------------------------------------------------------------------------------------------------------------------------------
const assertFieldName = (name: PropertyKey): string => {
  if (typeof name !== "string") throw new NonStringObjectFieldNameError({ path: [] });
  if (name.length === 0) throw new EmptyFieldNameError({ path: [name] });
  if (name.startsWith("_") || name.startsWith("$")) throw new ReservedFieldNameError({ name, path: [name] });
  if (!convexFieldNamePattern.test(name)) throw new InvalidFieldNameCharactersError({ name, path: [name] });
  return name;
};

const assertNonRecursiveAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): void => {
  switch (ast._tag) {
    case "Suspend":
      if (seen.has(ast.thunk)) throw new RecursiveSchemaError({ path });
      assertNonRecursiveAst(ast.thunk(), path, withSeen(seen, ast.thunk));
      return;
    case "Arrays":
      for (const element of ast.elements) assertNonRecursiveAst(element, pushPath(path, "[]"), seen);
      for (const rest of ast.rest) assertNonRecursiveAst(rest, pushPath(path, "[]"), seen);
      return;
    case "Objects":
      for (const propertySignature of ast.propertySignatures)
        assertNonRecursiveAst(propertySignature.type, pushPath(path, String(propertySignature.name)), seen);

      for (const indexSignature of ast.indexSignatures) {
        assertNonRecursiveAst(indexSignature.parameter, pushPath(path, "<key>"), seen);
        assertNonRecursiveAst(indexSignature.type, pushPath(path, "<value>"), seen);
      }

      return;
    case "Union":
      for (const [index, member] of ast.types.entries()) assertNonRecursiveAst(member, pushPath(path, `|${index}`), seen);
      return;
    case "Declaration":
      for (const [index, typeParameter] of ast.typeParameters.entries())
        assertNonRecursiveAst(typeParameter, pushPath(path, `<type:${index}>`), seen);

      return;
    default:
      return;
  }
};

// VALIDATORS ------------------------------------------------------------------------------------------------------------------------------
const vFrom = ({ ast, path, allowOptional, seen }: ConvexValidatorFromAstArgs): ConvexValueValidator => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);
  if (!SchemaAST.isOptional(encodedAst)) return vRequiredFrom(encodedAst, path, seen);
  if (!allowOptional) throw new OptionalValueOutsideObjectFieldError({ path });
  return vOptionalFrom(encodedAst, path, seen);
};
type ConvexValidatorFromAstArgs = { ast: SchemaAST.AST; path: SchemaPath; allowOptional: boolean; seen: Set<SuspendThunk> };

const vEnumFrom = (ast: SchemaAST.Enum, path: SchemaPath): VRequired => {
  const values = [...new Set(ast.enums.map(([, value]) => value))];
  if (values.length === 0) throw new EmptyEnumValuesError({ path });
  if (values.length === 1) return v.literal(values[0]);
  const members = values.map((value) => v.literal(value));
  return v.union(...asNonEmptyTuple(members, path));
};

const vObjectOrRecordFrom = (ast: SchemaAST.Objects, path: SchemaPath, seen: Set<SuspendThunk>): VRequired => {
  if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) throw new EmptyObjectKeywordError({ path });
  if (ast.propertySignatures.length > 0 && ast.indexSignatures.length > 0) throw new MixedObjectAndRecordFieldsError({ path });
  if (ast.indexSignatures.length > 0) {
    if (ast.indexSignatures.length !== 1) throw new MultipleRecordKeysError({ path });

    const [indexSignature] = ast.indexSignatures;

    if (SchemaAST.isOptional(indexSignature.type)) throw new OptionalRecordValueError({ path });

    return v.record(
      vRecordKeyFrom(indexSignature.parameter, pushPath(path, "<key>"), seen),
      vRequiredFrom(indexSignature.type, pushPath(path, "<value>"), seen)
    );
  }

  return v.object(
    pipe(
      ast.propertySignatures,
      Arr.map(({ name, type }) => Tuple.make(assertFieldName(name), type)),
      Record.fromEntries,
      Record.map((ast, name) => vFrom({ ast, path: [...path, name], allowOptional: true, seen }))
    )
  );
};

const vOptionalFrom = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): VOptional => {
  if (SchemaAST.isUnion(ast)) {
    const members = Arr.filter(ast.types, (member) => !SchemaAST.isUndefined(member));

    if (members.length === 0) throw new OptionalOnlyUndefinedError({ path });
    if (members.length === 1) return v.optional(vRequiredFrom(members[0], path, seen));

    const validators = pipe(
      members,
      Arr.map((member, index) => vRequiredFrom(member, pushPath(path, `|${index}`), seen))
    );

    return v.optional(unionFromMembers(asNonEmptyTuple(validators, path)));
  }

  return v.optional(vRequiredFrom(ast, path, seen));
};

const vRecordKeyFrom = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): Validator<string, "required", string> => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (SchemaAST.isOptional(encodedAst)) throw new OptionalRecordKeyError({ path });
  if (SchemaAST.isString(encodedAst)) return vStringFrom(encodedAst);

  if (SchemaAST.isUnion(encodedAst)) {
    const members = pipe(
      encodedAst.types,
      Arr.map((member, index) => vRecordKeyFrom(member, pushPath(path, `|${index}`), seen))
    );

    if (members.length === 0) throw new EmptyRecordKeyMembersError({ path });
    if (members.length === 1) return members[0];
    return v.union(...asNonEmptyTuple(members, path));
  }

  throw new InvalidRecordKeyError({ path, astTag: encodedAst._tag });
};

const vRequiredFrom = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): VRequired => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);

  if (encodedAst._tag === "String") return vStringFrom(encodedAst);
  if (encodedAst._tag === "Number") return v.number();
  if (encodedAst._tag === "BigInt") return v.int64();
  if (encodedAst._tag === "Boolean") return v.boolean();
  if (encodedAst._tag === "Null") return v.null();
  if (encodedAst._tag === "Literal") return v.literal(encodedAst.literal);
  if (encodedAst._tag === "Enum") return vEnumFrom(encodedAst, path);
  if (encodedAst._tag === "Arrays") {
    if (encodedAst.elements.length > 0 || encodedAst.rest.length !== 1) throw new UnsupportedArrayShapeError({ path });
    return v.array(vRequiredFrom(encodedAst.rest[0], pushPath(path, "[]"), seen));
  }
  if (encodedAst._tag === "Objects") return vObjectOrRecordFrom(encodedAst, path, seen);
  if (encodedAst._tag === "Union") {
    const members = pipe(
      encodedAst.types,
      Arr.map((member, index) => vRequiredFrom(member, pushPath(path, `|${index}`), seen)),
      (validators) => asNonEmptyTuple(validators, path)
    );
    return unionFromMembers(members);
  }
  if (encodedAst._tag === "Undefined") throw new UndefinedOutsideOptionalObjectFieldError({ path });
  if (encodedAst._tag === "Suspend") throw new RecursiveSchemaError({ path });
  throw new UnhandledAstTagError({ path, astTag: encodedAst._tag });
};

const vStringFrom = (ast: SchemaAST.String): Validator<string, "required", string> =>
  getTableName(ast).pipe(O.map(v.id), O.getOrElse(v.string));

// NORMALIZERS -----------------------------------------------------------------------------------------------------------------------------
const normalizeEncodedAst = (ast: SchemaAST.AST, path: SchemaPath, seen: Set<SuspendThunk>): SchemaAST.AST => {
  assertNonRecursiveAst(ast, path, seen);

  if (SchemaAST.isSuspend(ast)) {
    if (seen.has(ast.thunk)) throw new RecursiveSchemaError({ path });
    return normalizeEncodedAst(ast.thunk(), path, withSeen(seen, ast.thunk));
  }

  let encodedAst: SchemaAST.AST;

  try {
    encodedAst = SchemaAST.toEncoded(ast);
  } catch (error) {
    if (error instanceof RangeError) throw new RecursiveSchemaError({ path });
    throw error;
  }

  if (SchemaAST.isSuspend(encodedAst)) {
    if (seen.has(encodedAst.thunk)) throw new RecursiveSchemaError({ path });
    return normalizeEncodedAst(encodedAst.thunk(), path, withSeen(seen, encodedAst.thunk));
  }

  return encodedAst;
};

// HELPERS ---------------------------------------------------------------------------------------------------------------------------------
const pushPath = (path: SchemaPath, segment: string): SchemaPath => [...path, segment];
const withSeen = (seen: ReadonlySet<SuspendThunk>, thunk: SuspendThunk): Set<SuspendThunk> => new Set(seen).add(thunk);

const unionFromMembers = (members: readonly [VRequired, ...VRequired[]]): VRequired =>
  members.length === 1 ? members[0] : v.union(...members);

const asNonEmptyTuple = <T>(values: readonly T[], path: SchemaPath): readonly [T, ...T[]] => {
  if (values.length === 0) throw new EmptyUnionMembersError({ path });

  return values as unknown as readonly [T, ...T[]];
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

type VRequired = Validator<unknown, "required", string>;
type VOptional = Validator<unknown, "optional", string>;
type ConvexValueValidator = Validator<unknown, OptionalProperty, string>;
type SuspendThunk = SchemaAST.Suspend["thunk"];
type SchemaPath = readonly string[];
