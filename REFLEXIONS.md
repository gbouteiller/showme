# Final Revised Architecture

## Services by Context Type

| Context	| Services Available |
|---|---|
| Query	| DatabaseReader, Auth, StorageReader, RawQueryCtx |
| Mutation	| DatabaseWriter, Auth, StorageWriter, Scheduler, RawMutationCtx |
| Action	| Auth, StorageActionWriter, Scheduler, RunQuery, RunMutation, RunAction, RawActionCtx |

> Note: DatabaseWriter includes all DatabaseReader methods (since Convex's DatabaseWriter extends DatabaseReader).

## Final Clean Architecture

```
effy/
├── src/
│   ├── Schema/
│   │   ├── Id.ts                 # id("tableName")
│   │   ├── Bytes.ts              # ArrayBuffer schema  
│   │   ├── SystemFields.ts       # withSystemFields()
│   │   ├── Convert.ts            # toValidator()
│   │   ├── Registry.ts           # createSchemaRegistry()
│   │   └── index.ts
│   │
│   ├── Database/
│   │   ├── Reader.ts             # DatabaseReader
│   │   ├── Writer.ts             # DatabaseWriter
│   │   ├── QueryBuilder.ts       # EffyQueryBuilder
│   │   ├── Errors.ts             # DatabaseError, NotFoundError, etc.
│   │   └── index.ts
│   │
│   ├── Context/
│   │   ├── Auth.ts               # Auth service
│   │   ├── Storage.ts            # StorageReader, StorageWriter, StorageActionWriter
│   │   ├── Scheduler.ts          # Scheduler service
│   │   ├── Run.ts                # RunQuery, RunMutation, RunAction (for actions)
│   │   ├── RawCtx.ts             # RawQueryCtx, RawMutationCtx, RawActionCtx
│   │   ├── Types.ts              # QueryServices, MutationServices, ActionServices
│   │   └── index.ts
│   │
│   ├── Handler/
│   │   ├── EffectHandler.ts      # effectHandler()
│   │   ├── DefineEffect.ts       # defineEffect()
│   │   ├── ContextLayer.ts       # Layer factories
│   │   └── index.ts
│   │
│   ├── Errors/
│   │   ├── Types.ts              # Error classes
│   │   ├── ToConvexError.ts      # Effect → ConvexError
│   │   └── index.ts
│   │
│   └── index.ts
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```
~18 source files - still lean

## Context Services (All)

### Storage (3 variants matching Convex exactly)

```ts
// Context/Storage.ts

// Query: read-only
interface StorageReaderService {
  readonly getUrl: (storageId: Id<"_storage">) => Effect.Effect<Option.Option<string>, StorageError>
  readonly getMetadata: (storageId: Id<"_storage">) => Effect.Effect<Option.Option<FileMetadata>, StorageError>
}
class StorageReader extends Context.Tag("effy/StorageReader")<StorageReader, StorageReaderService>() {}

// Mutation: extends reader + generateUploadUrl
interface StorageWriterService extends StorageReaderService {
  readonly generateUploadUrl: () => Effect.Effect<string, StorageError>
}
class StorageWriter extends Context.Tag("effy/StorageWriter")<StorageWriter, StorageWriterService>() {}

// Action: different interface entirely
interface StorageActionWriterService {
  readonly getUrl: (storageId: Id<"_storage">) => Effect.Effect<Option.Option<string>, StorageError>
  readonly store: (blob: Blob) => Effect.Effect<Id<"_storage">, StorageError>
  readonly delete: (storageId: Id<"_storage">) => Effect.Effect<void, StorageError>
}
class StorageActionWriter extends Context.Tag("effy/StorageActionWriter")<StorageActionWriter, StorageActionWriterService>() {}
```

### Scheduler

```ts
// Context/Scheduler.ts
interface SchedulerService {
  readonly runAfter: <T extends FunctionReference<"mutation" | "action", any>>(
    delayMs: number,
    fn: T,
    args: FunctionArgs<T>
  ) => Effect.Effect<void, SchedulerError>
  
  readonly runAt: <T extends FunctionReference<"mutation" | "action", any>>(
    timestamp: number,
    fn: T,
    args: FunctionArgs<T>
  ) => Effect.Effect<void, SchedulerError>
  
  readonly cancel: (id: ScheduledFunctionId) => Effect.Effect<void, SchedulerError>
}

class Scheduler extends Context.Tag("effy/Scheduler")<Scheduler, SchedulerService>() {}
```

### Run Functions (Actions only)

```ts
// Context/Run.ts
interface RunQueryService {
  readonly run: <T extends FunctionReference<"query", any>>(
    fn: T,
    args: FunctionArgs<T>
  ) => Effect.Effect<FunctionReturnType<T>, RunError>
}
class RunQuery extends Context.Tag("effy/RunQuery")<RunQuery, RunQueryService>() {}

interface RunMutationService {
  readonly run: <T extends FunctionReference<"mutation", any>>(
    fn: T,
    args: FunctionArgs<T>
  ) => Effect.Effect<FunctionReturnType<T>, RunError>
}
class RunMutation extends Context.Tag("effy/RunMutation")<RunMutation, RunMutationService>() {}

interface RunActionService {
  readonly run: <T extends FunctionReference<"action", any>>(
    fn: T,
    args: FunctionArgs<T>
  ) => Effect.Effect<FunctionReturnType<T>, RunError>
}
class RunAction extends Context.Tag("effy/RunAction")<RunAction, RunActionService>() {}
```

### Service Type Unions

```ts
// Context/Types.ts

// Query context services
type QueryServices = 
  | DatabaseReader 
  | Auth 
  | StorageReader 
  | RawQueryCtx

// Mutation context services  
type MutationServices = 
  | DatabaseWriter      // includes Reader methods
  | Auth 
  | StorageWriter       // includes Reader methods
  | Scheduler 
  | RawMutationCtx

// Action context services (NO DatabaseReader/Writer!)
type ActionServices = 
  | Auth 
  | StorageActionWriter 
  | Scheduler 
  | RunQuery 
  | RunMutation 
  | RunAction 
  | RawActionCtx
```

## Typed Schema Registry

For full type safety, the registry must carry table types:

```ts
// Schema/Registry.ts`

// The registry is typed with table names → schemas
interface SchemaRegistry<
  Tables extends Record<string, Schema.Schema.Any> = Record<string, Schema.Schema.Any>
> {
  readonly _tables: Tables  // Phantom type for inference
  
  readonly decode: <T extends keyof Tables & string>(
    table: T,
    value: unknown
  ) => Effect.Effect<Schema.Schema.Type<Tables[T]>, DecodeError>
  
  readonly encode: <T extends keyof Tables & string>(
    table: T, 
    value: Schema.Schema.Type<Tables[T]>
  ) => Effect.Effect<Schema.Schema.Encoded<Tables[T]>, EncodeError>
  
  readonly encodePartial: <T extends keyof Tables & string>(
    table: T,
    value: Partial<Omit<Schema.Schema.Type<Tables[T]>, "_id" | "_creationTime">>
  ) => Effect.Effect<unknown, EncodeError>
}

const createSchemaRegistry = <Tables extends Record<string, Schema.Schema.Any>>(
  tables: Tables
): SchemaRegistry<Tables> => {
  // Implementation creates encode/decode functions for each table
}
```

## Usage:

```ts
// convex/lib/effy.ts
import { createSchemaRegistry } from "effy"
import { User, Post } from "./schemas"

// Registry is typed with exact table schemas
export const registry = createSchemaRegistry({
  users: User,   // Schema<UserType, UserEncoded>
  posts: Post,   // Schema<PostType, PostEncoded>
})

// Type: SchemaRegistry<{ users: typeof User, posts: typeof Post }>
```

The registry type flows through to DatabaseReader/Writer:

```ts
// In handler, db.get() returns the correct type based on Id<T>
const db = yield* DatabaseReader
const user = yield* db.get(userId)  // Effect<Option<UserType>, DatabaseError>
// user.value.email is Option<string> (decoded from Convex's string | null)
```

## Complete Exports

```ts
// index.ts

// === SCHEMA ===
export { id } from "./Schema"
export { Bytes } from "./Schema"
export { withSystemFields } from "./Schema"
export { toValidator } from "./Schema"
export { createSchemaRegistry } from "./Schema"
export type { SchemaRegistry } from "./Schema"

// === DATABASE ===
export { DatabaseReader } from "./Database"
export { DatabaseWriter } from "./Database"
export type { EffyQueryBuilder } from "./Database"

// === CONTEXT: Core ===
export { Auth } from "./Context"

// === CONTEXT: Storage ===
export { StorageReader } from "./Context"
export { StorageWriter } from "./Context"
export { StorageActionWriter } from "./Context"

// === CONTEXT: Scheduler ===
export { Scheduler } from "./Context"

// === CONTEXT: Run (Actions) ===
export { RunQuery } from "./Context"
export { RunMutation } from "./Context"
export { RunAction } from "./Context"

// === CONTEXT: Raw (Escape Hatches) ===
export { RawQueryCtx } from "./Context"
export { RawMutationCtx } from "./Context"
export { RawActionCtx } from "./Context"

// === CONTEXT: Type Unions ===
export type { QueryServices, MutationServices, ActionServices } from "./Context"

// === HANDLER ===
export { effectHandler } from "./Handler"
export { defineEffect } from "./Handler"

// === ERRORS ===
export { DatabaseError, NotFoundError, NotUniqueError } from "./Errors"
export { DecodeError, EncodeError } from "./Errors"
export { StorageError, SchedulerError, RunError } from "./Errors"
export { toConvexError } from "./Errors"
```

## Implementation Phases (Ordered)

| Phase	| Files	| Priority	| Dependencies |
|---|---|---|---|
|1|Schema/Id.ts|Critical|None|
|2|Schema/Bytes.ts|High|None|
|3|Schema/SystemFields.ts|High|Id.ts|
|4|Schema/Convert.ts|Critical|Id.ts, Bytes.ts|
|5|Errors/Types.ts|High|None|
|6|Schema/Registry.ts|Critical|Convert.ts|
|7|Context/RawCtx.ts|High|None|
|8|Context/Auth.ts|High|None|
|9|Context/Storage.ts|High|Errors|
|10|Context/Scheduler.ts|High|Errors|
|11|Context/Run.ts|High|Errors|
|12|Database/Errors.ts|High|Errors/Types.ts|
|13|Database/QueryBuilder.ts|Critical|Errors|
|14|Database/Reader.ts|Critical|QueryBuilder, Registry|
|15|Database/Writer.ts|Critical|Reader|
|16|Context/Types.ts|High|All Context|
|17|Handler/ContextLayer.ts|Critical|All Context, Database|
|18|Handler/EffectHandler.ts|Critical|ContextLayer|
|19|Handler/DefineEffect.ts|High|EffectHandler|
|20|Errors/ToConvexError.ts|High|Errors/Types|
|21|index.ts|High|All|
|22|Build config, package.json|High|None|
|23|Tests|High|All|

## Final Summary

effy is:

1. Light: ~18 source files, minimal abstractions
2. Robust: Effect-native with proper error handling
3. Strongly typed: Registry carries table types, full type inference
4. Modular:
    - Just toValidator() for minimal adoption
    - Add effectHandler() for Effect handlers
    - Add DatabaseReader/Writer for full encode/decode
    - Each service usable independently

## Key design decisions:

- Native Convex defineSchema/defineTable with toValidator()
- Handler-level wrapping (works with any function builder)
- Actions have NO DatabaseReader/Writer (accurate to Convex)
- Three storage variants matching Convex exactly
- Registry is typed for full type safety
- RawCtx escape hatches for everything not yet effectified