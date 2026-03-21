# Effect v3 -> v4 Migration Plan

## Scope

This plan is for this repository, which currently uses:

- `effect@^3.19.19`
- `@effect/platform@^0.94.5`
- `@effect/language-service@^0.73.1`

Relevant code is concentrated in:

- `convex/effex/**`
- `convex/shows.ts`
- `convex/episodes.ts`
- `src/services/tvmaze.ts`
- `src/functions/**`
- `src/schemas/**`

The upstream guide says the main v4 changes are:

- ecosystem-wide version alignment
- package consolidation into `effect`
- `Context.Tag` services moving to `ServiceMap.Service`
- flattened `Cause`
- renamed `catch*` and forking helpers
- `Runtime<R>` removal
- `Scope` and `Schema` changes

Sources:

- https://github.com/Effect-TS/effect-smol/blob/main/MIGRATION.md
- `npm view effect dist-tags --json` on 2026-03-21 returned `beta: 4.0.0-beta.36`

## Recommendation

Do this migration in a dedicated branch and treat it as a small refactor project, not a one-shot dependency bump. The previous `confect` blocker has already been removed from this repository, so the remaining work is now fully inside your own code: package consolidation, service migration, `Cause`, and `Schema`.

## Step 1: Freeze a baseline before touching dependencies

What to do:

1. Run the current validation suite.
2. Add one temporary migration checklist issue or tracking doc for compile errors and behavioral regressions.
3. Capture a known-good lockfile state.

Why:

- v4 is a major API migration. You need a clean baseline before TypeScript starts failing everywhere.
- This repo has no visible existing migration notes, so the easiest way to avoid losing context is to track breakages as they are discovered.

How to verify:

- `bun test`
- your normal build command succeeds on the v3 branch

## Step 2: Resolve external blockers first

What to do:

1. Audit every package that directly depends on Effect.
2. Confirm whether each one supports Effect v4.
3. For this repo, focus on the remaining Effect-adjacent tooling and libraries.

Why:

- The upstream guide says v4 consolidates many packages into `effect` and expects version alignment.
- You want dependency incompatibilities discovered before you start refactoring services and schemas.

Repo-specific impact:

- `@effect/language-service` should be checked for v4 compatibility, but that is usually a tooling concern, not an application blocker.
- The `confect` `Id` usage has already been removed, and this repo already has its own Convex ID schema helper in `convex/effex/schemas/genericId.ts` via `sId`.

Decision options:

1. Upgrade any remaining Effect-adjacent package if a v4-compatible release exists.
2. Remove or replace packages that only add thin wrappers around Effect APIs.
3. Treat editor tooling separately from runtime dependencies.

Exit criteria:

- no package in `package.json` still hard-requires Effect v3 for production code

## Step 3: Align dependencies with the v4 release model

What to do:

1. Upgrade `effect` to a single v4 beta version.
2. Remove packages whose APIs moved into `effect`.
3. Re-add only the packages that remain separate in v4 and have matching support.

Why:

- The upstream guide explicitly says v4 uses shared versioning and package consolidation.
- In practice, this means you should choose one `effect@4.0.0-beta.x` version and make the rest of the Effect ecosystem match that model.

Repo-specific expectation:

- `@effect/platform` usage in `src/services/tvmaze.ts` and the Convex entrypoints is a likely import migration area.
- Some functionality previously imported from `@effect/platform` may now come from `effect/unstable/http` or another v4 module, depending on the final stabilized path at the beta you pick.

Concrete package work:

1. Change `effect` from `^3.19.19` to a chosen v4 beta.
2. Remove `@effect/platform` from `package.json`.
3. Reinstall and let TypeScript show the new unresolved imports.
4. Update or remove `@effect/language-service` if needed after checking its v4 support.

Important note:

- As of 2026-03-21, `npm view effect dist-tags --json` reports `beta: 4.0.0-beta.36`.
- Use one exact beta across the migration branch to avoid moving-target failures.

Exit criteria:

- install completes
- lockfile is updated once
- no duplicate Effect major versions are pulled in

## Step 4: Replace imports based on package consolidation

What to do:

1. Rewrite imports that still come from removed or relocated packages.
2. Prefer the current v4 import path from official docs for each module.
3. Keep import rewrites mechanical before changing behavior.

Why:

- This gives you a first compile pass with mostly syntactic failures.
- It separates “module moved” from “API semantics changed”.

Repo-specific search targets:

- `src/services/tvmaze.ts`
- `convex/episodes.ts`
- `convex/shows.ts`

Likely patterns:

- `@effect/platform`
- `@effect/platform/HttpClientError`
- `effect/Cause`
- `effect/ParseResult`
- `effect/Types`

How to do it safely:

1. Update one module family at a time.
2. Run TypeScript after each family.
3. Commit small checkpoints if the branch gets noisy.

Exit criteria:

- all imports resolve again, even if some type errors remain

## Step 5: Migrate service definitions from `Context.Tag` to the v4 service API

What to do:

1. Replace every custom service built with `Context.Tag(...)`.
2. Update service construction and access sites to the v4 `ServiceMap.Service` pattern from the upstream guide.
3. Keep the public service surface identical where possible.

Why:

- This is the largest repo-specific breaking change.
- Your `convex/effex/services/*` layer is built around `Context.Tag`, and the upstream guide calls that out directly.

Files affected:

- `convex/effex/services/Auth.ts`
- `convex/effex/services/DatabaseReader.ts`
- `convex/effex/services/DatabaseWriter.ts`
- `convex/effex/services/Helpers.ts`
- `convex/effex/services/ActionCtx.ts`
- `convex/effex/services/MutationCtx.ts`
- `convex/effex/services/QueryCtx.ts`
- `convex/effex/services/Scheduler.ts`
- `convex/effex/services/StorageReader.ts`
- `convex/effex/services/StorageWriter.ts`
- `convex/effex/services/StorageActionWriter.ts`

Why this step matters here:

- These files define both raw Convex wrappers like `ConvexAuth` and higher-level services like `Auth`.
- The rest of the app relies on `yield* Auth`, `yield* DatabaseReader`, `yield* Helpers`, and similar access patterns.

Migration approach:

1. Start with the smallest leaf services: `Auth`, `Scheduler`, `StorageReader`.
2. Then migrate dependent services: `DatabaseReader`, `DatabaseWriter`, `StorageWriter`, `StorageActionWriter`.
3. Finish with composition-heavy services: `ActionCtx`, `MutationCtx`, `QueryCtx`.

What to preserve:

- method names
- return types where possible
- the `Live` constructors that take Convex runtime objects

Why that order:

- leaf services minimize uncertainty
- once those compile, the larger context layers become straightforward wiring changes

Exit criteria:

- every service compiles under the new API
- all call sites still obtain services through the Effect environment without ad hoc plumbing

## Step 6: Update layer composition and `provide` usage

What to do:

1. Revisit every `Layer.effect`, `Layer.succeed`, `Layer.sync`, `Layer.provide`, and `Layer.provideMerge`.
2. Replace deprecated forms with the v4 equivalents expected by the new service model.
3. Re-check all `E.provide(...)` calls.

Why:

- The upstream guide mentions layer memoization changes and service model changes.
- Even where names still exist, the types often change enough that old compositions stop inferring correctly.

Repo-specific hotspots:

- `convex/effex/index.ts`
- `convex/effex/services/ActionCtx.ts`
- `convex/effex/services/MutationCtx.ts`
- `convex/effex/services/QueryCtx.ts`

Concrete reason:

- these files compose multiple layers together and then inject them with `E.provide(layer(ctx))`
- this is exactly where environment typing changes tend to surface first

Exit criteria:

- `handler(decodedArgs).pipe(E.provide(layer(ctx)))` or its v4 equivalent type-checks
- no service is accidentally being provided twice or left unresolved

## Step 7: Rewrite manual `Cause` inspection for the flattened v4 structure

What to do:

1. Replace code that assumes the old nested cause shape.
2. Re-implement Convex error translation against the v4 `Cause` helpers.
3. Retest fail vs defect mapping.

Why:

- The upstream guide explicitly calls out `Cause: Flattened Structure`.
- This repo manually inspects causes in its core function wrapper.

Primary file:

- `convex/effex/index.ts`

Current v3-sensitive logic:

- `Cause.isFailType(exit.cause)`
- `Cause.isDieType(exit.cause)`
- direct access to `exit.cause.error`
- direct access to `exit.cause.defect`
- `exit.cause[Cause.CauseTypeId]`

Why this needs care:

- This wrapper is the boundary between Effect failures and Convex exceptions.
- If the mapping is wrong, user-facing errors will become opaque or internal defects will be misreported.

Recommended migration strategy:

1. Rebuild the error mapping using the official v4 helpers for extracting failures and defects.
2. Preserve existing behavior:
   - `EffexError` failure -> `ConvexError(message)`
   - `EffexError` defect -> `ConvexError(message)`
   - unknown defect/failure -> rethrow original data
3. Add tests specifically for this file if none exist.

Exit criteria:

- fail and defect cases still round-trip to Convex correctly
- unknown causes still log and throw in a debuggable way

## Step 8: Fix `catch*`, forking, and runtime helper renames if they appear during compile

What to do:

1. Search for `catch`, `catchAll`, `catchTag`, `fork`, and runtime helper usage after the first compile pass.
2. Rename APIs according to the v4 guide where needed.
3. Keep changes mechanical.

Why:

- The guide lists these as breaking areas even if this repo does not currently show many direct hits.
- Some of these may surface indirectly once imports move and types tighten.

Repo-specific expectation:

- there are no obvious heavy `catch*` call sites in the initial grep, so this is probably a light pass
- `E.runPromiseExit` usage in `convex/effex/index.ts` should be checked during the runtime pass

Exit criteria:

- no compile errors remain from renamed core combinators

## Step 9: Check for `Runtime<R>` assumptions

What to do:

1. Search for `Runtime`, `ManagedRuntime`, and any code that stores environment-parameterized runtimes.
2. Replace those with the v4 runtime model if present.

Why:

- The upstream guide explicitly says `Runtime<R>` was removed.
- Even if this repo does not use it directly today, this is a required confirmation step.

Repo-specific expectation:

- no direct `Runtime<R>` use was found in the initial scan, so this should likely be a confirm-and-close step

Exit criteria:

- no types or helpers in the repo assume a runtime carries `R` at the type level

## Step 10: Migrate schema code carefully and separately

What to do:

1. Upgrade all `Schema` usage after core services compile.
2. Re-check decode and encode signatures, constructors, transforms, and parse error handling.
3. Expect this to be the second largest change after services.

Why:

- The upstream guide links a separate Schema migration guide, which means Schema should be treated as its own workstream.
- This repo uses Schema heavily in both runtime validation and type derivation.

Files with meaningful Schema usage:

- `src/schemas/*.ts`
- `convex/schema.ts`
- `convex/fetcher.ts`
- `convex/shows.ts`
- `convex/episodes.ts`
- `convex/effex/schemas/*.ts`
- `convex/effex/services/Helpers.ts`

Specific patterns to review:

1. `S.decode(...)` and `S.encode(...)`
2. `ParseResult.succeed(...)` and `ParseResult.fail(...)`
3. `new ParseResult.Forbidden(...)`
4. `S.transform(...)`
5. `S.partial(...)`
6. `S.mutable(...)`
7. `S.Schema.Type<>` and `S.Schema.Encoded<>`

Why this step is separate:

- In v4, Schema changed structurally, including type parameters and some constructor/serialization patterns.
- If you mix service migration and Schema migration in one pass, the error volume becomes too high to reason about.

Repo-specific risk:

- `src/schemas/dtos.ts` uses multiple custom `ParseResult` transformations and explicit forbidden encodes.
- `convex/effex/services/Helpers.ts` derives many helper types from schema internals.
- `convex/effex/schemas/validators.ts` appears to work close to parsing internals and may need the most manual adjustment.

Recommended order:

1. compile simple `S.Struct`, `S.Array`, `S.optional`, `S.partial` files first
2. then fix `Helpers.ts`
3. then migrate custom transforms in `src/schemas/dtos.ts`
4. finish with validator internals

Exit criteria:

- all schema decoders/encoders compile
- Convex document encode/decode round-trips still behave correctly

## Step 11: Re-check utility imports that may have moved or changed shape

What to do:

1. Revisit every import from subpaths like `effect/Cause`, `effect/ParseResult`, `effect/Types`, and `effect/Function`.
2. Replace them with the v4 location or alternative type helper.

Why:

- v4 reorganizes modules, and the unstable/stable split affects import paths.
- These are low-level imports, so breakage here tends to cascade into many type errors.

Repo-specific search targets:

- `src/functions/utils.ts`
- `src/functions/episodes.ts`
- `src/components/episodes/widget.tsx`
- `src/components/episodes/list.tsx`
- `src/components/shows/list.tsx`
- `convex/effex/utils.ts`

Notes:

- `Simplify` imports from `effect/Types` may need replacement with another exported utility or a local type helper.
- `dual` from `effect/Function` should be verified against the chosen v4 beta.

Exit criteria:

- no leftover subpath imports rely on removed module layout

## Step 12: Re-run the full TypeScript compile and fix inference regressions

What to do:

1. Run the full build after the major API migrations.
2. Fix remaining type inference issues one by one.
3. Avoid large speculative rewrites until you understand each inference failure.

Why:

- Effect upgrades often finish with a small number of environment or schema inference regressions.
- Those are usually easier to fix once imports and service models are already correct.

Common likely failures in this repo:

- `E.fn.Return<...>` signatures
- environment inference around `handler(...)`
- schema-derived helper types in `Helpers.ts`
- `Option` and `HashMap` generic inference after method signature changes

Exit criteria:

- `bun run build` succeeds
- editor diagnostics are clean in migrated files

## Step 13: Add focused regression tests around the migration boundaries

What to do:

1. Add or update tests around service wiring.
2. Add tests for Convex error translation.
3. Add tests for schema transforms that reject encode paths intentionally.

Why:

- The riskiest failures here are not “compile broke”; they are subtle behavior changes at boundaries.

Highest-value tests in this repo:

1. `convex/effex/index.ts`:
   - schema decode failure
   - `EffexError` fail
   - `EffexError` defect
   - unknown cause path
2. `convex/effex/services/Helpers.ts`:
   - decode nullable doc
   - encode insert/patch/replace
3. `src/schemas/dtos.ts`:
   - decode allowed
   - encode forbidden stays forbidden

Exit criteria:

- tests prove boundary behavior stayed stable, not just types

## Step 14: Do a final dependency cleanup pass

What to do:

1. Remove packages that became unnecessary after consolidation.
2. Remove compatibility shims you introduced during migration.
3. Re-run install and ensure the lockfile is stable.

Why:

- v4’s consolidation only pays off if the repo actually drops obsolete packages and dead wrappers.

Things to check here:

- `@effect/platform` fully removed
- no dead imports remain
- no local migration aliases remain unless they are intentional abstractions

Exit criteria:

- dependency graph is minimal
- there is one clear Effect version strategy in `package.json`

## Suggested execution order

1. Baseline and branch setup.
2. Confirm remaining dependencies are v4-compatible.
3. Bump dependencies and reinstall.
4. Fix import-path breakage from consolidation.
5. Migrate `Context.Tag` services.
6. Fix layer composition and environment provisioning.
7. Rewrite `Cause` handling.
8. Migrate Schema-heavy code.
9. Clean up utility imports and inference issues.
10. Add boundary tests.
11. Final cleanup and lockfile stabilization.

## Expected high-risk areas

1. `convex/effex/index.ts` because it translates Effect failure semantics into Convex exceptions.
2. `convex/effex/services/*` because the codebase is strongly centered on custom services.
3. `src/schemas/dtos.ts` and `convex/effex/schemas/validators.ts` because they use Schema internals rather than only basic schema constructors.
4. import-path churn from `@effect/platform` removal and any remaining tooling mismatch.

## Expected low-risk areas

- business logic using `Option`, `Array`, `HashMap`, and `Effect.gen` in `src/functions/**`
- straightforward `S.Struct(...)` schema declarations without custom transformations

## Definition of done

The migration is complete when all of the following are true:

1. the repo runs on one chosen `effect@4.0.0-beta.x`
2. no production dependency still hard-requires Effect v3
3. all imports resolve under the v4 package layout
4. all `Context.Tag` services are migrated
5. Convex error mapping behaves the same as before
6. schema decode/encode behavior is verified in tests
7. `bun test` and `bun run build` pass
