# Orval `$ref` Suffix Reproduction

This repository reproduces a bug in `@orval/mock` where the `override.components.schemas.suffix` option is not applied to `$ref`-resolved schema names during mock generation.

## The Issue

When a schema suffix is configured via `override.components.schemas.suffix`, Orval correctly renames the generated TypeScript types (e.g., `TypeA` becomes `TypeADto`). However, the mock generator in `@orval/mock` was resolving `$ref` schema names using `originalName` from `getRefInfo` and re-applying `pascal()` to it, producing the unsuffixed name. This caused mock helper functions to reference non-existent type names (e.g., `TypeA` instead of `TypeADto`), resulting in TypeScript errors.

### Configuration

[orval.config.ts](orval.config.ts) configures a `"Dto"` suffix for all component schemas:

```ts
override: {
  components: {
    schemas: {
      suffix: "Dto",
    },
  },
},
```

### Schema

[schema.yaml](schema.yaml) defines two schemas (`TypeA`, `TypeB`) referenced via `$ref` inside a `oneOf`:

```yaml
items:
  oneOf:
    - $ref: '#/components/schemas/TypeA'
    - $ref: '#/components/schemas/TypeB'
```

### Expected behavior

Mock functions should reference the suffixed types: `TypeADto`, `TypeBDto`.

### Actual behavior (unpatched)

Mock functions reference the unsuffixed types: `TypeA`, `TypeB`, which do not exist in the generated output, causing compilation errors.

## The Fix

The patch in [patches/@orval__mock.patch](patches/@orval__mock.patch) changes `resolveMockValue` in `@orval/mock` to use `name` (which already includes the suffix) instead of `pascal(originalName)` (which strips it):

```diff
-const { originalName, refPaths } = getRefInfo(schema.$ref, context);
+const { name, refPaths } = getRefInfo(schema.$ref, context);
 const newSchema = {
   ...schemaRef,
-  name: pascal(originalName),
+  name,
```

## Reproduction

```sh
pnpm install
pnpm exec orval
```

The generated output in [src/generated/](src/generated/) reflects the patched behavior. Without the patch, the mock factory functions in `endpoints.ts` would reference `TypeA` and `TypeB` instead of `TypeADto` and `TypeBDto`.