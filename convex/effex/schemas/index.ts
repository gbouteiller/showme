import { type OptionalProperty, type Validator, v } from "convex/values";
import { Array as Arr, Cause, Effect as E, Exit, HashSet, Layer, Option as O, Result, type Schema as S, SchemaAST, ServiceMap } from "effect";
import type { ConvexSchemaError } from "./errors";
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

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
type ConvexSchemaConverterShape = {
  readonly fromSchema: <const Fields extends S.Struct.Fields>(
    schema: S.Struct<Fields>
  ) => E.Effect<ConvexSchemaFromFields<Fields>, ConvexSchemaError>;
};

export class ConvexSchemaConverter extends ServiceMap.Service<ConvexSchemaConverter, ConvexSchemaConverterShape>()("ConvexSchemaConverter", {
  make: E.succeed({
    fromSchema: <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>) => {
      const traversal = makeTraversal(emptyPath, HashSet.empty<SuspendThunk>());

      return E.gen(function* () {
        const entries = yield* E.forEach(Reflect.ownKeys(schema.fields), (name) =>
          E.gen(function* () {
            const normalizedName = yield* traversal.normalizeFieldName(name);
            const field = schema.fields[normalizedName as keyof Fields];

            return [
              normalizedName,
              yield* traversal.descend(normalizedName).value(field.ast, true),
            ] as const;
          })
        );

        return Object.fromEntries(entries) as ConvexSchemaFromFields<Fields>;
      });
    },
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export const convexSchemaFromEffect = <const Fields extends S.Struct.Fields>(
  schema: S.Struct<Fields>
): E.Effect<ConvexSchemaFromFields<Fields>, ConvexSchemaError, ConvexSchemaConverter> =>
  E.gen(function* () {
    const converter = yield* ConvexSchemaConverter;
    return yield* converter.fromSchema(schema);
  });

export const convexSchemaFrom = <const Fields extends S.Struct.Fields>(schema: S.Struct<Fields>): ConvexSchemaFromFields<Fields> => {
  const exit = E.runSyncExit(convexSchemaFromEffect(schema).pipe(E.provide(ConvexSchemaConverter.layer)));

  if (Exit.isSuccess(exit)) return exit.value;

  const fail = Cause.findFail(exit.cause);
  if (Result.isSuccess(fail)) throw fail.success.error;

  const defect = Cause.findDie(exit.cause);
  if (Result.isSuccess(defect)) throw defect.success.defect;

  throw exit.cause;
};

// HELPERS ---------------------------------------------------------------------------------------------------------------------------------
const makeTraversal = (path: SchemaPath, seen: Seen) => {
  const descend = (segment: string) => makeTraversal([...path, segment], seen);
  const withSeen = (thunk: SuspendThunk) => makeTraversal(path, HashSet.add(seen, thunk));

  const fail = <Error extends ConvexSchemaError>(error: Error): E.Effect<never, Error> => E.fail(error);

  const normalizeFieldName = (name: PropertyKey): E.Effect<string, ConvexSchemaError> => {
    if (typeof name !== "string") return fail(new NonStringObjectFieldNameError({ path }));

    const fieldPath = [...path, name];

    if (name.length === 0) return fail(new EmptyFieldNameError({ path: fieldPath }));
    if (name.startsWith("_") || name.startsWith("$")) return fail(new ReservedFieldNameError({ name, path: fieldPath }));
    if (!convexFieldNamePattern.test(name)) return fail(new InvalidFieldNameCharactersError({ name, path: fieldPath }));

    return E.succeed(name);
  };

  const assertNonRecursiveAst = (ast: SchemaAST.AST): E.Effect<void, ConvexSchemaError> =>
    E.gen(function* () {
      switch (ast._tag) {
        case "Suspend":
          if (HashSet.has(seen, ast.thunk)) return yield* fail(new RecursiveSchemaError({ path }));
          return yield* withSeen(ast.thunk).assertNonRecursiveAst(ast.thunk());
        case "Arrays":
          for (const element of ast.elements) {
            yield* descend("[]").assertNonRecursiveAst(element);
          }

          for (const rest of ast.rest) {
            yield* descend("[]").assertNonRecursiveAst(rest);
          }

          return;
        case "Objects":
          for (const propertySignature of ast.propertySignatures) {
            yield* descend(String(propertySignature.name)).assertNonRecursiveAst(propertySignature.type);
          }

          for (const indexSignature of ast.indexSignatures) {
            yield* descend("<key>").assertNonRecursiveAst(indexSignature.parameter);
            yield* descend("<value>").assertNonRecursiveAst(indexSignature.type);
          }

          return;
        case "Union":
          for (const [index, member] of ast.types.entries()) {
            yield* descend(`|${index}`).assertNonRecursiveAst(member);
          }

          return;
        case "Declaration":
          for (const [index, typeParameter] of ast.typeParameters.entries()) {
            yield* descend(`<type:${index}>`).assertNonRecursiveAst(typeParameter);
          }

          return;
        default:
          return;
      }
    });

  const normalizeEncodedAst = (ast: SchemaAST.AST): E.Effect<SchemaAST.AST, ConvexSchemaError> =>
    E.gen(function* () {
      yield* assertNonRecursiveAst(ast);

      if (SchemaAST.isSuspend(ast)) {
        if (HashSet.has(seen, ast.thunk)) return yield* fail(new RecursiveSchemaError({ path }));
        return yield* withSeen(ast.thunk).normalizeEncodedAst(ast.thunk());
      }

      const encodedAst = yield* E.suspend(() => {
        try {
          return E.succeed(SchemaAST.toEncoded(ast));
        } catch (error) {
          return error instanceof RangeError ? fail(new RecursiveSchemaError({ path })) : E.die(error);
        }
      });

      if (SchemaAST.isSuspend(encodedAst)) {
        if (HashSet.has(seen, encodedAst.thunk)) return yield* fail(new RecursiveSchemaError({ path }));
        return yield* withSeen(encodedAst.thunk).normalizeEncodedAst(encodedAst.thunk());
      }

      return encodedAst;
    });

  const string = (ast: SchemaAST.String): E.Effect<Validator<string, "required", string>> =>
    E.succeed(getTableName(ast).pipe(O.map(v.id), O.getOrElse(v.string)));

  const enum_ = (ast: SchemaAST.Enum): E.Effect<VRequired, ConvexSchemaError> => {
    const values = [...new Set(ast.enums.map(([, value]) => value))];

    if (values.length === 0) return fail(new EmptyEnumValuesError({ path }));

    return E.succeed(values.length === 1 ? v.literal(values[0]) : v.union(...values.map((value) => v.literal(value))));
  };

  const objectOrRecord = (ast: SchemaAST.Objects): E.Effect<VRequired, ConvexSchemaError> =>
    E.gen(function* () {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) return yield* fail(new EmptyObjectKeywordError({ path }));
      if (ast.propertySignatures.length > 0 && ast.indexSignatures.length > 0)
        return yield* fail(new MixedObjectAndRecordFieldsError({ path }));

      if (ast.indexSignatures.length > 0) {
        if (ast.indexSignatures.length !== 1) return yield* fail(new MultipleRecordKeysError({ path }));

        const [{ parameter, type }] = ast.indexSignatures;

        if (SchemaAST.isOptional(type)) return yield* fail(new OptionalRecordValueError({ path }));

        return v.record(
          yield* descend("<key>").recordKey(parameter),
          yield* descend("<value>").required(type),
        );
      }

      const entries = yield* E.forEach(ast.propertySignatures, ({ name, type }) =>
        E.gen(function* () {
          const normalizedName = yield* normalizeFieldName(name);

          return [
            normalizedName,
            yield* descend(normalizedName).value(type, true),
          ] as const;
        })
      );

      return v.object(Object.fromEntries(entries) as Record<string, ConvexValueValidator>);
    });

  const optional = (ast: SchemaAST.AST): E.Effect<VOptional, ConvexSchemaError> =>
    SchemaAST.isUnion(ast)
      ? E.gen(function* () {
          const members = Arr.filter(ast.types, (member) => !SchemaAST.isUndefined(member));

          if (members.length === 0) return yield* fail(new OptionalOnlyUndefinedError({ path }));
          if (members.length === 1) return v.optional(yield* required(members[0]));

          const validators = yield* E.forEach(members, (member, index) =>
            descend(`|${index}`).required(member)
          );

          return v.optional(validators.length === 1 ? validators[0] : v.union(...validators));
        })
      : E.map(required(ast), v.optional);

  const recordKey = (ast: SchemaAST.AST): E.Effect<Validator<string, "required", string>, ConvexSchemaError> =>
    E.gen(function* () {
      const encodedAst = yield* normalizeEncodedAst(ast);

      if (SchemaAST.isOptional(encodedAst)) return yield* fail(new OptionalRecordKeyError({ path }));
      if (SchemaAST.isString(encodedAst)) return yield* string(encodedAst);

      if (SchemaAST.isUnion(encodedAst)) {
        const members = yield* E.forEach(encodedAst.types, (member, index) =>
          descend(`|${index}`).recordKey(member)
        );

        if (members.length === 0) return yield* fail(new EmptyRecordKeyMembersError({ path }));
        return members.length === 1 ? members[0] : v.union(...members);
      }

      return yield* fail(new InvalidRecordKeyError({ path, astTag: encodedAst._tag }));
    });

  const required = (ast: SchemaAST.AST): E.Effect<VRequired, ConvexSchemaError> =>
    E.gen(function* () {
      const encodedAst = yield* normalizeEncodedAst(ast);

      switch (encodedAst._tag) {
        case "String":
          return yield* string(encodedAst);
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
          return yield* enum_(encodedAst);
        case "Arrays":
          if (encodedAst.elements.length > 0 || encodedAst.rest.length !== 1) return yield* fail(new UnsupportedArrayShapeError({ path }));
          return v.array(yield* descend("[]").required(encodedAst.rest[0]));
        case "Objects":
          return yield* objectOrRecord(encodedAst);
        case "Union": {
          const members = yield* E.forEach(encodedAst.types, (member, index) =>
            descend(`|${index}`).required(member)
          );

          if (members.length === 0) return yield* fail(new EmptyUnionMembersError({ path }));
          return members.length === 1 ? members[0] : v.union(...members);
        }
        case "Undefined":
          return yield* fail(new UndefinedOutsideOptionalObjectFieldError({ path }));
        case "Suspend":
          return yield* fail(new RecursiveSchemaError({ path }));
        default:
          return yield* fail(new UnhandledAstTagError({ path, astTag: encodedAst._tag }));
      }
    });

  const value = (ast: SchemaAST.AST, allowOptional: boolean): E.Effect<ConvexValueValidator, ConvexSchemaError> =>
    E.gen(function* () {
      const encodedAst = yield* normalizeEncodedAst(ast);

      if (!SchemaAST.isOptional(encodedAst)) return yield* required(encodedAst);
      if (!allowOptional) return yield* fail(new OptionalValueOutsideObjectFieldError({ path }));

      return yield* optional(encodedAst);
    });

  return {
    assertNonRecursiveAst,
    descend,
    enum_,
    normalizeEncodedAst,
    normalizeFieldName,
    objectOrRecord,
    optional,
    recordKey,
    required,
    string,
    value,
  };
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

type Seen = HashSet.HashSet<SuspendThunk>;
type VRequired = Validator<unknown, "required", string>;
type VOptional = Validator<unknown, "optional", string>;
type ConvexValueValidator = Validator<unknown, OptionalProperty, string>;
type SuspendThunk = SchemaAST.Suspend["thunk"];
type SchemaPath = readonly string[];
