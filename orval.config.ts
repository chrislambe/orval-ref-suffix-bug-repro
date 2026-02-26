import { defineConfig } from "orval";

export default defineConfig({
  foo: {
    input: "./schema.yaml",
    output: {
      target: "./src/generated/endpoints.ts",
      schemas: "./src/generated/schemas",
      mock: true,
      override: {
        components: {
          schemas: {
            suffix: "Dto",
          },
        },
      },
    },
  },
});
