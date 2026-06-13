import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative as relativePath } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
const docsRoot = join(projectRoot, "docs");
const failures = [];

for (const file of listMarkdownFiles(docsRoot)) {
  const content = readFileSync(file, "utf8");
  const matches = content.matchAll(/(?:^|\s)(?:[A-Z0-9_]+=[^\s]+\s+)*npm\s+run\s+([A-Za-z0-9:_-]+)/g);

  for (const match of matches) {
    const scriptName = match[1];

    if (!scripts.has(scriptName)) {
      failures.push(`${relative(file)} references missing npm script: ${scriptName}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Docs command check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Docs command check passed.");

function listMarkdownFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  const stat = statSync(path);

  if (stat.isFile()) {
    return path.endsWith(".md") ? [path] : [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => listMarkdownFiles(join(path, entry.name)));
}

function relative(path) {
  return relativePath(projectRoot, path).replaceAll("\\", "/");
}
