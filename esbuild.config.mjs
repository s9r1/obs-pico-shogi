import esbuild from "esbuild";
import process from "process";
import path from "path";
import { fileURLToPath } from "url";
import builtins from "builtin-modules";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.argv[2] === "production";

const banner = `/*
  obs-pico-shogi build artifact.
  This file is the bundled plugin entry. Do not edit by hand.
*/
`;

const ctx = await esbuild.context({
  absWorkingDir: __dirname,
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2021",
  treeShaking: true,
  sourcemap: prod ? false : "inline",
  outfile: "main.js",
  minify: prod,
  logLevel: "info",
  banner: { js: banner },
  alias: {
    // pico-shogi 側 node_modules と root 側で tsshogi が二重バンドルされるのを防ぐため、
    // root 側の node_modules/tsshogi に固定する。
    tsshogi: path.resolve(__dirname, "node_modules/tsshogi"),
  },
});

if (prod) {
  await ctx.rebuild();
  await ctx.dispose();
  process.exit(0);
} else {
  await ctx.watch();
}
