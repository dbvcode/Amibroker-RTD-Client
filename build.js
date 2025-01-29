import { build } from "esbuild";

build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./dist/index.js",
  format: "esm",    // Output as ES modules
  resolveExtensions: [".ts", ".tsx", ".js", ".json"], // Automatically resolve extensions
}).catch(() => process.exit(1));
