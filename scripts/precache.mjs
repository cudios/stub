import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const folders = ["src", "styles", "vendor", "assets"];
const rootFiles = ["./", "./index.html", "./manifest.webmanifest"];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])));
  return files.flat();
}

const files = (await Promise.all(folders.map((folder) => walk(join(root, folder))))).flat();
const shell = [...rootFiles, ...files.map((file) => `./${relative(root, file).split(sep).join("/")}`).sort()];
const swPath = join(root, "sw.js");
const source = await readFile(swPath, "utf8");
const list = `const APP_SHELL = [\n${shell.map((path) => `  "${path}"`).join(",\n")}\n];`;
const version = `const VERSION = "stub-${Date.now().toString(36)}";`;
await writeFile(swPath, source.replace(/const APP_SHELL = \[[\s\S]*?\];/, list).replace(/const VERSION = ".*?";/, version));
console.log(`Precache list updated with ${shell.length} files.`);
