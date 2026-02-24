# Effy Implementation Plan

## Core Principles

1. **Light**: Minimal abstractions, thin layer on top of Convex APIs
2. **Robust**: Proper error handling, type-safe at boundaries
3. **Strongly Typed**: Full TypeScript inference, no `any` types in public API
4. **Modular**: Use only what you need, incremental adoption

## Architecture Overview

```
effy/
├── src/
│   ├── Schema/          # Schema conversion (Effect → Convex)
│   ├── Database/        # Effectified DatabaseReader/Writer
│   ├── Context/         # Convex services as Effect services
│   ├── Handler/         # Effect handler wrappers
│   └── Errors/          # Typed error handling
```

## Module 1: Schema (Core Bridge)

### Files
- `src/Schema/Id.ts` - Branded ID schemas
- `src/Schema/Bytes.ts` - ArrayBuffer schema
- `src/Schema/SystemFields.ts` - Add _id, _creationTime
- `src/Schema/Convert.ts` - validatorFrom() conversion
- `src/Schema/Registry.ts` - Schema registry for encode/decode

### Key Types

```typescript
// Id.ts
export const sId = <T extends string>(tableName: T): Schema<Id<T>>

// SystemFields.ts  
export const sWithSystemFields = <T extends string, Fields extends Struct.Fields>(
  tableName: T,
  fieldsSchema: Struct<Fields>
): Struct<{ _id: Id<T>; _creationTime: number } & Fields>

// Convert.ts
export const validatorFrom = <A, I, R>(schema: Schema<A, I, R>): Validator<I>

// Registry.ts
export interface SchemaRegistry<Tables extends Record<string, Schema.Any>> {
  _tables: Tables  // Phantom type
  decode: <T extends keyof Tables>(table: T, value: unknown) => Effect<Type<Tables[T]>, DecodeError>
  encode: <T extends keyof Tables>(table: T, value: Type<Tables[T]>) => Effect<Encoded<Tables[T]>, EncodeError>
}
```

### Implementation Notes

1. Use proper Effect Schema types (Schema.Type, Schema.Encoded)
2. Map Effect types to Convex validators at type level
3. Use phantom types for inference
4. No `any` in public API

## Module 2: Database (Effectified)

### Files
- `src/Database/QueryInitializer.ts` - Fluent query interface
- `src/Database/Reader.ts` - DatabaseReader service
- `src/Database/Writer.ts` - DatabaseWriter service

### Key Types

```typescript
// QueryInitializer.ts
export interface QueryInitializer<TableName extends string, Doc> {
  withIndex<IndexName extends string>(...): QueryInitializer
  filter(predicate: (q: any) => any): QueryInitializer
  order(order: "asc" | "desc"): QueryInitializer
  first(): Effect<Option<Doc>, DatabaseError>
  unique(): Effect<Option<Doc>, DatabaseError | NotUniqueError>
  collect(): Effect<readonly Doc[], DatabaseError>
  take(n: number): Effect<readonly Doc[], DatabaseError>
}

// Reader.ts
export interface DatabaseReaderService {
  get: <T extends string>(id: Id<T>) => Effect<Option<Doc<T>>, DatabaseError>
  query: <T extends string>(table: T) => QueryInitializer<T, Doc<T>>
  normalizeId: <T extends string>(table: T, id: string) => Effect<Option<Id<T>>, never>
}

// Writer.ts
export interface DatabaseWriterService extends DatabaseReaderService {
  insert: <T extends string>(table: T, document: InsertDoc<T>) => Effect<Id<T>, DatabaseError | EncodeError>
  patch: <T extends string>(id: Id<T>, patch: Partial<InsertDoc<T>>) => Effect<void, DatabaseError | EncodeError>
  replace: <T extends string>(id: Id<T>, document: InsertDoc<T>) => Effect<void, DatabaseError | EncodeError>
  delete: <T extends string>(id: Id<T>) => Effect<void, DatabaseError>
}
```

### Implementation Notes

1. DatabaseWriter extends DatabaseReader (Convex's pattern)
2. Automatic encode/decode via SchemaRegistry
3. Proper generic constraints preserve table types
4. Returns Option for nullable operations

## Module 3: Context (Convex Services)

### Files
- `src/Context/Auth.ts` - Authentication service
- `src/Context/Storage.ts` - Storage services (3 variants!)
- `src/Context/Scheduler.ts` - Function scheduling
- `src/Context/Run.ts` - RunQuery/RunMutation/RunAction
- `src/Context/RawCtx.ts` - Escape hatches
- `src/Context/Types.ts` - Service type unions

### Key Types

```typescript
// Auth.ts
export interface AuthService {
  getUserIdentity: () => Effect<Option<UserIdentity>, never>
}

// Storage.ts - THREE variants matching Convex exactly!
export interface StorageReaderService {
  getUrl: (storageId: Id<"_storage">) => Effect<Option<string>, StorageError>
}

export interface StorageWriterService extends StorageReaderService {
  delete: (storageId: Id<"_storage">) => Effect<void, StorageError>
  generateUploadUrl: () => Effect<string, StorageError>
}

export interface StorageActionWriterService extends StorageWriterService {
  get: (storageId: Id<"_storage">) => Effect<Option<Blob>, StorageError>
  store: (blob: Blob, options?: { sha256?: string }) => Effect<Id<"_storage">, StorageError>
}

// Scheduler.ts
export interface SchedulerService {
  runAfter: <Ref extends SchedulableFunctionReference>(delayMs: number, fn: SchedulableFunctionReference, args: OptionalRestArgs<Ref>) => Effect<ScheduledFunctionId, SchedulerError>
  runAt: <Ref extends SchedulableFunctionReference>(timestamp: number | Date, fn: SchedulableFunctionReference, args: OptionalRestArgs<Ref>) => Effect<ScheduledFunctionId, SchedulerError>
  cancel: (id: ScheduledFunctionId) => Effect<void, SchedulerError>
}

// Run.ts (Actions only!)
export interface RunQueryService {
  run: <T extends FunctionReference<"query">>(fn: T, args: any) => Effect<ReturnType<T>, RunError>
}

export interface RunMutationService {
  run: <T extends FunctionReference<"mutation">>(fn: T, args: any) => Effect<ReturnType<T>, RunError>
}

export interface RunActionService {
  run: <T extends FunctionReference<"action">>(fn: T, args: any) => Effect<ReturnType<T>, RunError>
}

// RawCtx.ts (Escape hatches)
export class RawQueryCtx extends Context.Tag<"RawQueryCtx", GenericQueryCtx>() {}
export class RawMutationCtx extends Context.Tag<"RawMutationCtx", GenericMutationCtx>() {}
export class RawActionCtx extends Context.Tag<"RawActionCtx", GenericActionCtx>() {}
```

### Implementation Notes

1. **Storage has 3 variants** - Query uses Reader, Mutation uses Writer, Action uses ActionWriter
2. **Actions have no direct DB** - only RunQuery/RunMutation/RunAction services
3. **Escape hatches** - RawCtx for advanced use cases
4. **FunctionReferences** - Use Convex's typed function references

## Module 4: Handler (Effect Wrappers)

### Files
- `src/Handler/EffectHandler.ts` - Core handler wrapper
- `src/Handler/DefineEffect.ts` - Convenience helper
- `src/Handler/ContextLayer.ts` - Layer factories

### Key Types

```typescript
// EffectHandler.ts
export interface EffectHandlerConfig<Args extends Schema.Any, Returns extends Schema.Any> {
  registry: SchemaRegistry<any>
  args: Args
  returns: Returns
  handler: (args: Type<Args>) => Effect<Type<Returns>, E, ContextServices>
  layers?: ReadonlyArray<Layer<Any, never, never>>
}

export const effectHandler = <Ctx extends "query" | "mutation" | "action", Args, Returns, E, R>(
  ctxType: Ctx,
  config: EffectHandlerConfig<Args, Returns>
): (ctx: ConvexCtx<Ctx>, args: Encoded<Args>) => Promise<Encoded<Returns>>

// DefineEffect.ts
export const defineEffect = <Ctx extends "query" | "mutation" | "action", Args, Returns>(
  ctxType: Ctx,
  registry: SchemaRegistry<any>,
  config: {
    args: Args
    returns: Returns
    handler: (args: Type<Args>) => Effect<Type<Returns>, E, ContextServices>
    layers?: ReadonlyArray<Layer<Any, never, never>>
  }
): { args: Validator; returns: Validator; handler: ConvexHandler }

// ContextLayer.ts
export const makeQueryLayer = (ctx: GenericQueryCtx, registry: SchemaRegistry<any>): Layer<QueryServices, never, never>
export const makeMutationLayer = (ctx: GenericMutationCtx, registry: SchemaRegistry<any>): Layer<MutationServices, never, never>
export const makeActionLayer = (ctx: GenericActionCtx): Layer<ActionServices, never, never>
```

### Implementation Notes

1. **Handler-level wrapping** - Works with ANY Convex function builder
2. **Automatic encode/decode** - Schema conversion at boundaries
3. **Layer composition** - Combine context with custom services
4. **Type-safe errors** - Effect errors → ConvexError

## Module 5: Errors

### Files
- `src/Errors/Types.ts` - Error class definitions
- `src/Errors/ToConvexError.ts` - Error conversion

### Key Types

```typescript
// Types.ts
export class DatabaseError extends Data.TaggedError("DatabaseError")<{ message: string; cause?: unknown }> {}
export class NotFoundError extends Data.TaggedError("NotFoundError")<{ table: string; id: string }> {}
export class NotUniqueError extends Data.TaggedError("NotUniqueError")<{ table: string }> {}
export class DecodeError extends Data.TaggedError("DecodeError")<{ table: string; error: ParseError }> {}
export class EncodeError extends Data.TaggedError("EncodeError")<{ table: string; error: ParseError }> {}
export class StorageError extends Data.TaggedError("StorageError")<{ message: string; cause?: unknown }> {}
export class SchedulerError extends Data.TaggedError("SchedulerError")<{ message: string; cause?: unknown }> {}
export class RunError extends Data.TaggedError("RunError")<{ message: string; cause?: unknown }> {}

// ToConvexError.ts
export const toConvexError = (error: unknown): ConvexError<any>
```

## Public API Design

### Exports (index.ts)

```typescript
// === SCHEMA ===
export { sId, sBytes, sWithSystemFields, validatorFrom, createSchemaRegistry, SchemaRegistry }
export type { Id, SchemaRegistry }

// === DATABASE ===
export { DatabaseReader, DatabaseWriter, makeQueryInitializer }
export type { DatabaseReaderService, DatabaseWriterService, QueryInitializer }

// === CONTEXT ===
export { Auth, StorageReader, StorageWriter, StorageActionWriter, Scheduler, RunQuery, RunMutation, RunAction }
export type { AuthService, StorageReaderService, StorageWriterService, StorageActionWriterService, SchedulerService, RunQueryService, RunMutationService, RunActionService }

// === HANDLER ===
export { effectHandler, defineEffect, makeQueryLayer, makeMutationLayer, makeActionLayer }

// === ERRORS ===
export { DatabaseError, NotFoundError, NotUniqueError, DecodeError, EncodeError, toConvexError }

// === RE-EXPORTS ===
export { Schema as S, Effect as E, Context, Layer, Option, Data } from "effect"
```

## Usage Examples

### Basic: Schema Conversion Only

```typescript
import { validatorFrom, sId } from "effy"
import { S } from "effect"

const sUserArgs = S.Struct({
  name: S.String,
  email: S.optional(S.String),
})

export const createUser = mutation({
  args: validatorFrom(sUserArgs),
  handler: async (ctx, args) => {
    // Regular Convex handler
    return ctx.db.insert("users", args)
  },
})
```

### Full Effect: Define Effect Functions

```typescript
import { defineEffect, DatabaseReader, DatabaseWriter, sId } from "effy"
import { Schema as S, Effect as E, Option as O } from "effect"

const sUserDoc = sWithSystemFields("users", S.Struct({
  name: S.String,
  email: S.OptionFromNullOr(S.String),
}))

const registry = createSchemaRegistry({ users: sUserDoc })

export const getUser = query(
  defineEffect("query", registry, {
    args: S.Struct({ userId: sId("users") }),
    returns: S.OptionFromNullOr(sUserDoc),
    handler: (args) =>
      E.gen(function* () {
        const db = yield* DatabaseReader
        return yield* db.get(args.userId)
      }),
  })
)

export const createUser = mutation(
  defineEffect("mutation", registry, {
    args: S.Struct({ name: S.String, email: S.OptionFromNullOr(S.String) }),
    returns: sId("users"),
    handler: (args) =>
      E.gen(function* () {
        const db = yield* DatabaseWriter
        return yield* db.insert("users", args)
      }),
  })
)
```

### Custom Functions (Triggers, Auth)

```typescript
import { customMutation, customCtx } from "convex-helpers/server/customFunctions"
import { triggers } from "./lib/triggers"

const mutationWithTriggers = customMutation(mutation, customCtx(triggers.wrapDB))

export const createWithTriggers = mutationWithTriggers(
  defineEffect("mutation", registry, {
    args: UserInsert,
    returns: sId("users"),
    handler: (args) =>
      E.gen(function* () {
        const db = yield* DatabaseWriter
        return yield* db.insert("users", args)
        // Triggers fire automatically!
      }),
  })
)
```

### Custom Services with Layers

```typescript
import { Context, Effect, Layer } from "effect"

class EmailService extends Context.Tag("EmailService")<
  EmailService,
  { send: (to: string, subject: string) => Effect<void, EmailError> }
>() {}

const EmailLive = Layer.succeed(EmailService, {
  send: (to, subject) => Effect.tryPromise(() => sendEmail(to, subject)),
})

export const sendWelcome = action(
  defineEffect("action", registry, {
    args: S.Struct({ userId: sId("users") }),
    returns: S.Void,
    layers: [EmailLive],
    handler: (args) =>
      E.gen(function* () {
        const runQuery = yield* RunQuery
        const email = yield* EmailService
        
        const user = yield* Effect.promise(() =>
          runQuery.run(api.users.get, { userId: args.userId })
        )
        
        if (O.isSome(user) && O.isSome(user.value.email)) {
          yield* email.send(user.value.email.value, "Welcome!")
        }
      }),
  })
)
```

## Type Safety Strategy

### Critical Principle

Effect's `Schema<A, I, R>` and Convex's `Validator<Type, Optional>` have fundamentally different type systems. The bridge requires strategic type assertions at the boundary:

1. **Schema Conversion** (Convert.ts): Use type guards and exhaustive checks, not `any`
2. **Registry** (Registry.ts): Phantom types preserve table-specific schemas
3. **Database** (Reader/Writer.ts): Generics constrained to registry tables
4. **Handler** (EffectHandler.ts): Effect types at the edges, Convex types at boundaries

### Where `any` is Acceptable

- Inside `validatorFrom()` - the conversion is inherently bridging two type systems
- Raw context services - for escape hatches when types aren't available
- Convex function references - TypeScript can't track function reference types statically

### Where `any` is NOT Acceptable

- Public API exports
- User-facing handler types
- Document decode/return types
- Error types

## Implementation Order

1. **Schema/Id.ts, Bytes.ts, SystemFields.ts** - Foundation
2. **Schema/Convert.ts** - Core bridge (most complex)
3. **Schema/Registry.ts** - Type-safe registry
4. **Errors/Types.ts, ToConvexError.ts** - Error handling
5. **Context/RawCtx.ts** - Escape hatches
6. **Context/Auth.ts, Storage.ts, Scheduler.ts, Run.ts** - Services
7. **Database/QueryInitializer.ts** - Query interface
8. **Database/Reader.ts, Writer.ts** - Effectified DB
9. **Handler/ContextLayer.ts** - Layer factories
10. **Handler/EffectHandler.ts** - Core wrapper
11. **Handler/DefineEffect.ts** - Convenience
12. **index.ts** - Public API

## Testing Strategy

- Unit tests for Schema conversion
- Integration tests with Convex test environment
- Type tests using TypeScript's type system
- Example projects demonstrating each usage pattern

## Success Criteria

1. ✅ TypeScript compiles with `strict: true`
2. ✅ No `any` types in public API
3. ✅ Full type inference for users
4. ✅ Works with custom function builders
5. ✅ Works with native Convex APIs
6. ✅ Incremental adoption possible
7. ✅ No runtime overhead for type safety
