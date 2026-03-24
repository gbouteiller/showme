import { type OptionalProperty, type Validator, v } from "convex/values";
import { Array as Arr, HashSet, Option as O, pipe, Record, type Schema as S, SchemaAST, Tuple } from "effect";
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
const emptyPath = [] as const satisfies SchemaPath;

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export const convexSchemaFrom = <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>): ConvexSchemaFromFields<Fields> =>
  pipe(
    Reflect.ownKeys(schema.fields),
    Arr.map((name) => Tuple.make(normalizeFieldName(name, emptyPath), schema.fields[name].ast)),
    Record.fromEntries,
    Record.map((ast, name) => vFrom({ ast, path: [name], allowOptional: true, seen: HashSet.empty() }))
  ) as ConvexSchemaFromFields<Fields>;

// NORMALIZERS -----------------------------------------------------------------------------------------------------------------------------
const normalizeEncodedAst = (ast: SchemaAST.AST, path: SchemaPath, seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>): SchemaAST.AST => {
  assertNonRecursiveAst(ast, path, seen);

  if (SchemaAST.isSuspend(ast)) {
    if (HashSet.has(seen, ast.thunk)) throw new RecursiveSchemaError({ path });
    return normalizeEncodedAst(ast.thunk(), path, HashSet.add(seen, ast.thunk));
  }

  let encodedAst: SchemaAST.AST;

  try {
    encodedAst = SchemaAST.toEncoded(ast);
  } catch (error) {
    if (error instanceof RangeError) throw new RecursiveSchemaError({ path });
    throw error;
  }

  if (SchemaAST.isSuspend(encodedAst)) {
    if (HashSet.has(seen, encodedAst.thunk)) throw new RecursiveSchemaError({ path });
    return normalizeEncodedAst(encodedAst.thunk(), path, HashSet.add(seen, encodedAst.thunk));
  }

  return encodedAst;
};

const normalizeFieldName = (name: PropertyKey, parentPath: SchemaPath): string => {
  if (typeof name !== "string") throw new NonStringObjectFieldNameError({ path: parentPath });

  const path = [...parentPath, name];

  if (name.length === 0) throw new EmptyFieldNameError({ path });
  if (name.startsWith("_") || name.startsWith("$")) throw new ReservedFieldNameError({ name, path });
  if (!convexFieldNamePattern.test(name)) throw new InvalidFieldNameCharactersError({ name, path });
  return name;
};

const assertNonRecursiveAst = (ast: SchemaAST.AST, path: SchemaPath, seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>): void => {
  if (ast._tag === "Suspend") {
    if (HashSet.has(seen, ast.thunk)) throw new RecursiveSchemaError({ path });
    assertNonRecursiveAst(ast.thunk(), path, HashSet.add(seen, ast.thunk));
  } else if (ast._tag === "Arrays") {
    for (const element of ast.elements) assertNonRecursiveAst(element, [...path, "[]"], seen);
    for (const rest of ast.rest) assertNonRecursiveAst(rest, [...path, "[]"], seen);
  } else if (ast._tag === "Objects") {
    for (const { name, type } of ast.propertySignatures) assertNonRecursiveAst(type, [...path, String(name)], seen);
    for (const { parameter, type } of ast.indexSignatures) {
      assertNonRecursiveAst(parameter, [...path, "<key>"], seen);
      assertNonRecursiveAst(type, [...path, "<value>"], seen);
    }
  } else if (ast._tag === "Union")
    for (const [index, member] of ast.types.entries()) assertNonRecursiveAst(member, [...path, `|${index}`], seen);
  else if (ast._tag === "Declaration")
    for (const [index, typeParameter] of ast.typeParameters.entries())
      assertNonRecursiveAst(typeParameter, [...path, `<type:${index}>`], seen);
};

// VALIDATORS ------------------------------------------------------------------------------------------------------------------------------
const vFrom = ({ ast, path, allowOptional, seen }: VFromArgs): ConvexValueValidator => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);
  if (!SchemaAST.isOptional(encodedAst)) return vRequiredFrom(encodedAst, path, seen);
  if (!allowOptional) throw new OptionalValueOutsideObjectFieldError({ path });
  return vOptionalFrom(encodedAst, path, seen);
};
type VFromArgs = { ast: SchemaAST.AST; path: SchemaPath; allowOptional: boolean; seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]> };

const vEnumFrom = (ast: SchemaAST.Enum, path: SchemaPath): VRequired =>
  pipe(
    [...new Set(ast.enums.map(([, value]) => value))],
    Arr.match({
      onEmpty: () => {
        throw new EmptyEnumValuesError({ path });
      },
      onNonEmpty: (values) => (values.length === 1 ? v.literal(values[0]) : v.union(...values.map((value) => v.literal(value)))),
    })
  );

const vObjectOrRecordFrom = (ast: SchemaAST.Objects, path: SchemaPath, seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>): VRequired => {
  if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) throw new EmptyObjectKeywordError({ path });
  if (ast.propertySignatures.length > 0 && ast.indexSignatures.length > 0) throw new MixedObjectAndRecordFieldsError({ path });
  if (ast.indexSignatures.length > 0) {
    if (ast.indexSignatures.length !== 1) throw new MultipleRecordKeysError({ path });
    const [{ parameter, type }] = ast.indexSignatures;
    if (SchemaAST.isOptional(type)) throw new OptionalRecordValueError({ path });
    return v.record(vRecordKeyFrom(parameter, [...path, "<key>"], seen), vRequiredFrom(type, [...path, "<value>"], seen));
  }

  return v.object(
    pipe(
      ast.propertySignatures,
      Arr.map(({ name, type }) => Tuple.make(normalizeFieldName(name, path), type)),
      Record.fromEntries,
      Record.map((ast, name) => vFrom({ ast, path: [...path, name], allowOptional: true, seen }))
    )
  );
};

const vOptionalFrom = (ast: SchemaAST.AST, path: SchemaPath, seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>): VOptional =>
  SchemaAST.isUnion(ast)
    ? pipe(
        ast.types,
        Arr.filter((member) => !SchemaAST.isUndefined(member)),
        Arr.match({
          onEmpty: () => {
            throw new OptionalOnlyUndefinedError({ path });
          },
          onNonEmpty: (members) => {
            if (members.length === 1) return v.optional(vRequiredFrom(members[0], path, seen));
            const validators = Arr.map(members, (member, index) => vRequiredFrom(member, [...path, `|${index}`], seen));
            return v.optional(validators.length === 1 ? validators[0] : v.union(...validators));
          },
        })
      )
    : v.optional(vRequiredFrom(ast, path, seen));

const vRecordKeyFrom = (
  ast: SchemaAST.AST,
  path: SchemaPath,
  seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>
): Validator<string, "required", string> => {
  const encodedAst = normalizeEncodedAst(ast, path, seen);
  if (SchemaAST.isOptional(encodedAst)) throw new OptionalRecordKeyError({ path });
  if (SchemaAST.isString(encodedAst)) return vStringFrom(encodedAst);
  if (SchemaAST.isUnion(encodedAst))
    return pipe(
      encodedAst.types,
      Arr.map((member, index) => vRecordKeyFrom(member, [...path, `|${index}`], seen)),
      Arr.match({
        onEmpty: () => {
          throw new EmptyRecordKeyMembersError({ path });
        },
        onNonEmpty: (members) => (members.length === 1 ? members[0] : v.union(...members)),
      })
    );
  throw new InvalidRecordKeyError({ path, astTag: encodedAst._tag });
};

const vRequiredFrom = (ast: SchemaAST.AST, path: SchemaPath, seen: HashSet.HashSet<SchemaAST.Suspend["thunk"]>): VRequired => {
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
    return v.array(vRequiredFrom(encodedAst.rest[0], [...path, "[]"], seen));
  }
  if (encodedAst._tag === "Objects") return vObjectOrRecordFrom(encodedAst, path, seen);
  if (encodedAst._tag === "Union") {
    return pipe(
      encodedAst.types,
      Arr.map((member, index) => vRequiredFrom(member, [...path, `|${index}`], seen)),
      Arr.match({
        onEmpty: () => {
          throw new EmptyUnionMembersError({ path });
        },
        onNonEmpty: (members) => (members.length === 1 ? members[0] : v.union(...members)),
      })
    );
  }
  if (encodedAst._tag === "Undefined") throw new UndefinedOutsideOptionalObjectFieldError({ path });
  if (encodedAst._tag === "Suspend") throw new RecursiveSchemaError({ path });
  throw new UnhandledAstTagError({ path, astTag: encodedAst._tag });
};

const vStringFrom = (ast: SchemaAST.String): Validator<string, "required", string> =>
  getTableName(ast).pipe(O.map(v.id), O.getOrElse(v.string));

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
type SchemaPath = readonly string[];
