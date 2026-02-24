/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import type {
  PropertyValidators,
  VAny,
  VArray,
  Validator,
  VBoolean,
  VBytes,
  VFloat64,
  VId,
  VInt64,
  VLiteral,
  VNull,
  VObject,
  VOptional,
  VRecord,
  VString,
  VUnion,
} from "convex/values";
import { v } from "convex/values";
import {
  Array as Arr,
  Cause,
  Data,
  Effect as E,
  Exit,
  Match,
  Number as Num,
  Option as O,
  type ParseResult,
  Predicate,
  pipe,
  Schema as S,
  SchemaAST,
  String as Str,
} from "effect";
import { type GenericId, getTableName } from "./genericId";
import type { DeepMutable, IsAny, IsOptional, IsRecord, IsRecursive, IsUnion, IsValueLiteral, TypeError, UnionToTuple } from "./types";

// ARGS ------------------------------------------------------------------------------------------------------------------------------------
export const argsFrom = <EA, A>(sArgs: S.Schema<EA, A>): PropertyValidators =>
  pipe(
    S.encodedSchema(sArgs).ast,
    Match.value,
    Match.tag("TypeLiteral", (typeLiteralAst) =>
      Arr.isEmptyReadonlyArray(typeLiteralAst.indexSignatures)
        ? handlePropertySignatures(typeLiteralAst)
        : E.fail(new IndexSignaturesAreNotSupportedError())
    ),
    Match.orElse(() => E.fail(new TopLevelMustBeObjectError())),
    runSyncThrow
  );

// RETURNS ---------------------------------------------------------------------------------------------------------------------------------
export const returnsFrom = <ER, R>(sReturns: S.Schema<ER, R>): Validator<any, any, any> =>
  runSyncThrow(compileAst(S.encodedSchema(sReturns).ast));

// TABLE -----------------------------------------------------------------------------------------------------------------------------------

/**
 * Convert a table `Schema` to a table `Validator`.
 */
export type TableSchemaToTableValidator<TableSchema extends S.Schema.AnyNoContext> =
  ValueToValidator<TableSchema["Encoded"]> extends infer Vd extends VObject<any, any, any, any> | VUnion<any, any, any, any>
    ? Vd
    : // TODO: Add type error message
      never;

export const tableFrom = <TableSchema extends S.Schema.AnyNoContext>(schema: TableSchema): TableSchemaToTableValidator<TableSchema> => {
  const ast = S.encodedSchema(schema).ast;

  return pipe(
    ast,
    Match.value,
    Match.tag("TypeLiteral", ({ indexSignatures }) =>
      Arr.isEmptyReadonlyArray(indexSignatures) ? (compileAst(ast) as E.Effect<any>) : E.fail(new IndexSignaturesAreNotSupportedError())
    ),
    Match.tag("Union", (unionAst) => compileAst(unionAst)),
    Match.orElse(() => E.fail(new TopLevelMustBeObjectOrUnionError())),
    runSyncThrow
  );
};

// COMPILER --------------------------------------------------------------------------------------------------------------------------------
export type ReadonlyValue = string | number | bigint | boolean | ArrayBuffer | ReadonlyArrayValue | ReadonlyRecordValue | null;

type ReadonlyArrayValue = readonly ReadonlyValue[];

export type ReadonlyRecordValue = {
  readonly [key: string]: ReadonlyValue | undefined;
};

export type ValueToValidator<Vl> =
  IsRecursive<Vl> extends true
    ? VAny
    : [Vl] extends [never]
      ? never
      : IsAny<Vl> extends true
        ? VAny
        : [Vl] extends [ReadonlyValue]
          ? Vl extends {
              __tableName: infer TableName extends string;
            }
            ? VId<GenericId<TableName>>
            : IsValueLiteral<Vl> extends true
              ? VLiteral<Vl>
              : [Vl] extends [null]
                ? VNull
                : [Vl] extends [boolean]
                  ? VBoolean
                  : IsUnion<Vl> extends true
                    ? UnionValueToValidator<Vl>
                    : [Vl] extends [number]
                      ? VFloat64
                      : [Vl] extends [bigint]
                        ? VInt64
                        : [Vl] extends [string]
                          ? VString
                          : [Vl] extends [ArrayBuffer]
                            ? VBytes
                            : Vl extends readonly ReadonlyValue[]
                              ? ArrayValueToValidator<Vl>
                              : Vl extends ReadonlyRecordValue
                                ? RecordValueToValidator<Vl>
                                : TypeError<"Unexpected value", Vl>
          : TypeError<"Provided value is not a valid Convex value", Vl>;

type ArrayValueToValidator<Vl extends readonly ReadonlyValue[]> =
  Vl extends ReadonlyArray<infer El extends ReadonlyValue>
    ? ValueToValidator<El> extends infer Vd extends Validator<any, any, any>
      ? VArray<DeepMutable<El[]>, Vd>
      : never
    : never;

type RecordValueToValidator<Vl> = Vl extends ReadonlyRecordValue
  ? {
      -readonly [K in keyof Vl]-?: IsAny<Vl[K]> extends true
        ? IsOptional<Vl, K> extends true
          ? VOptional<VAny>
          : VAny
        : UndefinedOrValueToValidator<Vl[K]>;
    } extends infer VdRecord extends Record<string, any>
    ? {
        -readonly [K in keyof Vl]: undefined extends Vl[K] ? DeepMutable<Exclude<Vl[K], undefined>> : DeepMutable<Vl[K]>;
      } extends infer VlRecord extends Record<string, any>
      ? IsRecord<VlRecord> extends true
        ? VRecord<VlRecord, VString, VdRecord[keyof VdRecord]>
        : VObject<VlRecord, VdRecord>
      : never
    : never
  : never;

export type UndefinedOrValueToValidator<Vl extends ReadonlyValue | undefined> = undefined extends Vl
  ? [Vl] extends [(infer Val extends ReadonlyValue) | undefined]
    ? ValueToValidator<Val> extends infer Vd extends Validator<any, "required", any>
      ? VOptional<Vd>
      : never
    : never
  : [Vl] extends [ReadonlyValue]
    ? ValueToValidator<Vl>
    : never;

type UnionValueToValidator<Vl extends ReadonlyValue> = [Vl] extends [ReadonlyValue]
  ? IsUnion<Vl> extends true
    ? UnionToTuple<Vl> extends infer VlTuple extends readonly ReadonlyValue[]
      ? ValueTupleToValidatorTuple<VlTuple> extends infer VdTuple extends Validator<any, "required", any>[]
        ? VUnion<DeepMutable<Vl>, VdTuple>
        : TypeError<"Failed to convert value tuple to validator tuple">
      : TypeError<"Failed to convert union to tuple">
    : TypeError<"Expected a union of values, but got a single value instead">
  : TypeError<"Provided value is not a valid Convex value">;

type ValueTupleToValidatorTuple<VlTuple extends readonly ReadonlyValue[]> = VlTuple extends
  | [true, false, ...infer VlRest extends readonly ReadonlyValue[]]
  | [false, true, ...infer VlRest extends readonly ReadonlyValue[]]
  ? ValueTupleToValidatorTuple<VlRest> extends infer VdRest extends Validator<any, any, any>[]
    ? [VBoolean<boolean>, ...VdRest]
    : never
  : VlTuple extends [infer Vl extends ReadonlyValue, ...infer VlRest extends readonly ReadonlyValue[]]
    ? ValueToValidator<Vl> extends infer Vd extends Validator<any, any, any>
      ? ValueTupleToValidatorTuple<VlRest> extends infer VdRest extends Validator<any, "required", any>[]
        ? [Vd, ...VdRest]
        : never
      : never
    : [];

export const compileSchema = <T, Err>(
  schema: S.Schema<T, Err>
  // TODO: Can `ValueToValidator` here just accept `E` directly?
): ValueToValidator<(typeof schema)["Encoded"]> => runSyncThrow(compileAst(schema.ast)) as any;

export const isRecursive = (ast: SchemaAST.AST): boolean =>
  pipe(
    ast,
    Match.value,
    Match.tag(
      "Literal",
      "BooleanKeyword",
      "StringKeyword",
      "NumberKeyword",
      "BigIntKeyword",
      "UnknownKeyword",
      "AnyKeyword",
      "Declaration",
      "UniqueSymbol",
      "SymbolKeyword",
      "UndefinedKeyword",
      "VoidKeyword",
      "NeverKeyword",
      "Enums",
      "TemplateLiteral",
      "ObjectKeyword",
      "Transformation",
      () => false
    ),
    Match.tag("Union", ({ types }) => Arr.some(types, (type) => isRecursive(type))),
    Match.tag("TypeLiteral", ({ propertySignatures }) => Arr.some(propertySignatures, ({ type }) => isRecursive(type))),
    Match.tag(
      "TupleType",
      ({ elements: optionalElements, rest: elements }) =>
        Arr.some(optionalElements, (optionalElement) => isRecursive(optionalElement.type)) ||
        Arr.some(elements, (element) => isRecursive(element.type))
    ),
    Match.tag("Refinement", ({ from }) => isRecursive(from)),
    Match.tag("Suspend", () => true),
    Match.exhaustive
  );

export const compileAst = (
  ast: SchemaAST.AST,
  isOptionalPropertyOfTypeLiteral = false
): E.Effect<
  Validator<any, any, any>,
  | UnsupportedSchemaTypeError
  | UnsupportedPropertySignatureKeyTypeError
  | IndexSignaturesAreNotSupportedError
  | MixedIndexAndPropertySignaturesAreNotSupportedError
  | OptionalTupleElementsAreNotSupportedError
  | EmptyTupleIsNotSupportedError
> =>
  isRecursive(ast)
    ? E.succeed(v.any())
    : pipe(
        ast,
        Match.value,
        Match.tag("Literal", ({ literal }) =>
          pipe(
            literal,
            Match.value,
            Match.whenOr(Match.string, Match.number, Match.bigint, Match.boolean, (l) => v.literal(l)),
            Match.when(Match.null, () => v.null()),
            Match.exhaustive,
            E.succeed
          )
        ),
        Match.tag("BooleanKeyword", () => E.succeed(v.boolean())),
        Match.tag("StringKeyword", (stringAst) =>
          getTableName(stringAst).pipe(
            O.match({
              onNone: () => E.succeed(v.string()),
              onSome: (tableName) => E.succeed(v.id(tableName)),
            })
          )
        ),
        Match.tag("NumberKeyword", () => E.succeed(v.float64())),
        Match.tag("BigIntKeyword", () => E.succeed(v.int64())),
        Match.tag("Union", (unionAst) => handleUnion(unionAst, isOptionalPropertyOfTypeLiteral)),
        Match.tag("TypeLiteral", (typeLiteralAst) => handleTypeLiteral(typeLiteralAst)),
        Match.tag("TupleType", (tupleTypeAst) => handleTupleType(tupleTypeAst)),
        Match.tag("UnknownKeyword", "AnyKeyword", () => E.succeed(v.any())),
        Match.tag("Declaration", (declaration) =>
          E.mapBoth(
            declaration.decodeUnknown(...declaration.typeParameters)(new ArrayBuffer(0), {}, declaration) as E.Effect<
              ArrayBuffer,
              ParseResult.ParseIssue
            >,
            {
              onSuccess: () => v.bytes(),
              onFailure: () =>
                new UnsupportedSchemaTypeError({
                  schemaType: declaration._tag,
                }),
            }
          )
        ),
        Match.tag("Refinement", ({ from }) => compileAst(from)),
        Match.tag("Suspend", () => E.succeed(v.any())),
        Match.tag(
          "UniqueSymbol",
          "SymbolKeyword",
          "UndefinedKeyword",
          "VoidKeyword",
          "NeverKeyword",
          "Enums",
          "TemplateLiteral",
          "ObjectKeyword",
          "Transformation",
          () =>
            new UnsupportedSchemaTypeError({
              schemaType: ast._tag,
            })
        ),
        Match.exhaustive
      );

const handleUnion = ({ types: [first, second, ...rest] }: SchemaAST.Union, isOptionalPropertyOfTypeLiteral: boolean) =>
  E.gen(function* () {
    const validatorEffects = isOptionalPropertyOfTypeLiteral
      ? Arr.filterMap([first, second, ...rest], (type) =>
          Predicate.not(SchemaAST.isUndefinedKeyword)(type) ? O.some(compileAst(type)) : O.none()
        )
      : Arr.map([first, second, ...rest], (type) => compileAst(type));

    const [firstValidator, secondValidator, ...restValidators] = yield* E.all(validatorEffects);

    /* v8 ignore start */
    if (firstValidator === undefined) {
      return yield* E.dieMessage("First validator of union is undefined; this should be impossible.");
      /* v8 ignore stop */
    }
    if (secondValidator === undefined) {
      return firstValidator;
    }
    return v.union(firstValidator, secondValidator, ...restValidators);
  });

const handleTypeLiteral = (typeLiteralAst: SchemaAST.TypeLiteral) =>
  pipe(
    typeLiteralAst.indexSignatures,
    Arr.head,
    O.match({
      onNone: () => E.map(handlePropertySignatures(typeLiteralAst), v.object),
      onSome: ({ parameter, type }) =>
        pipe(
          typeLiteralAst.propertySignatures,
          Arr.head,
          O.match({
            onNone: () =>
              E.map(
                E.all({
                  parameter_: compileAst(parameter),
                  type_: compileAst(type),
                }),
                ({ parameter_, type_ }) => v.record(parameter_, type_)
              ),
            onSome: () => E.fail(new MixedIndexAndPropertySignaturesAreNotSupportedError()),
          })
        ),
    })
  );

const handleTupleType = ({ elements, rest }: SchemaAST.TupleType) =>
  E.gen(function* () {
    const restValidator = pipe(
      rest,
      Arr.head,
      O.map(({ type }) => compileAst(type)),
      E.flatten
    );

    const [f, s, ...r] = elements;

    const elementToValidator = ({ type, isOptional }: SchemaAST.OptionalType) =>
      E.if(isOptional, {
        onTrue: () => E.fail(new OptionalTupleElementsAreNotSupportedError()),
        onFalse: () => compileAst(type),
      });

    if (f === undefined)
      return v.array(
        yield* pipe(
          restValidator,
          E.catchTag("NoSuchElementException", () => E.fail(new EmptyTupleIsNotSupportedError()))
        )
      );
    if (s === undefined) return v.array(yield* elementToValidator(f));
    return v.array(v.union(yield* elementToValidator(f), yield* elementToValidator(s), ...(yield* E.forEach(r, elementToValidator))));
  });

export const handlePropertySignatures = (typeLiteralAst: SchemaAST.TypeLiteral) =>
  pipe(
    typeLiteralAst.propertySignatures,
    E.forEach(({ type, name, isOptional }) => {
      if (Str.isString(name)) {
        // Somehow, somewhere, keys of type number are being coerced to strings…
        return O.match(Num.parse(name), {
          onNone: () =>
            E.gen(function* () {
              const validator = yield* compileAst(type, isOptional);

              return {
                propertyName: name,
                validator: isOptional ? v.optional(validator) : validator,
              };
            }),
          onSome: (number) =>
            E.fail(
              new UnsupportedPropertySignatureKeyTypeError({
                propertyKey: number,
              })
            ),
        });
      }
      return E.fail(new UnsupportedPropertySignatureKeyTypeError({ propertyKey: name }));
    }),
    E.andThen((propertyNamesWithValidators) =>
      pipe(
        propertyNamesWithValidators,
        Arr.reduce({} as Record<string, Validator<any, any, any>>, (acc, { propertyName, validator }) => ({
          [propertyName]: validator,
          ...acc,
        })),
        E.succeed
      )
    )
  );

// ERRORS ----------------------------------------------------------------------------------------------------------------------------------
export const runSyncThrow = <A, Err>(effect: E.Effect<A, Err>) =>
  pipe(
    effect,
    E.runSyncExit,
    Exit.match({
      onSuccess: (validator) => validator,
      onFailure: (cause) => {
        throw Cause.squash(cause);
      },
    })
  );

export class TopLevelMustBeObjectError extends Data.TaggedError("TopLevelMustBeObjectError") {
  /* v8 ignore start */
  override get message() {
    return "Top level schema must be an object";
  }
  /* v8 ignore stop */
}

export class TopLevelMustBeObjectOrUnionError extends Data.TaggedError("TopLevelMustBeObjectOrUnionError") {
  /* v8 ignore start */
  override get message() {
    return "Top level schema must be an object or a union";
  }
  /* v8 ignore stop */
}

export class UnsupportedPropertySignatureKeyTypeError extends Data.TaggedError("UnsupportedPropertySignatureKeyTypeError")<{
  readonly propertyKey: number | symbol;
}> {
  /* v8 ignore start */
  override get message() {
    return `Unsupported property signature '${this.propertyKey.toString()}'. Property is of type '${typeof this.propertyKey}' but only 'string' properties are supported.`;
  }
  /* v8 ignore stop */
}

export class EmptyTupleIsNotSupportedError extends Data.TaggedError("EmptyTupleIsNotSupportedError") {
  /* v8 ignore start */
  override get message() {
    return "Tuple must have at least one element";
  }
  /* v8 ignore stop */
}

export class UnsupportedSchemaTypeError extends Data.TaggedError("UnsupportedSchemaTypeError")<{
  readonly schemaType: SchemaAST.AST["_tag"];
}> {
  /* v8 ignore start */
  override get message() {
    return `Unsupported schema type '${this.schemaType}'`;
  }
  /* v8 ignore stop */
}

export class IndexSignaturesAreNotSupportedError extends Data.TaggedError("IndexSignaturesAreNotSupportedError") {
  /* v8 ignore start */
  override get message() {
    return "Index signatures are not supported";
  }
  /* v8 ignore stop */
}

export class MixedIndexAndPropertySignaturesAreNotSupportedError extends Data.TaggedError(
  "MixedIndexAndPropertySignaturesAreNotSupportedError"
) {
  /* v8 ignore start */
  override get message() {
    return "Mixed index and property signatures are not supported";
  }
  /* v8 ignore stop */
}

export class OptionalTupleElementsAreNotSupportedError extends Data.TaggedError("OptionalTupleElementsAreNotSupportedError") {
  /* v8 ignore start */
  override get message() {
    return "Optional tuple elements are not supported";
  }
  /* v8 ignore stop */
}
