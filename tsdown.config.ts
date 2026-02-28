import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  clean: true,
  dts: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
