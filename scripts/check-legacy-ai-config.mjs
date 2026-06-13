import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);
const ignoredFiles = new Set([
  ".env.local",
  "package-lock.json",
  "scripts/check-ai-config.mjs",
  "scripts/check-deployment-template.mjs",
  "scripts/check-legacy-ai-config.mjs",
  "scripts/smoke-ai-config-check.mjs"
]);

const allowedBinaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf"]);

const forbiddenPatterns = [
  {
    name: "zhipu-api-key",
    pattern: /\bZHIPU_API_KEY\b/i
  },
  {
    name: "zhipu-provider",
    pattern: /\bLIGHTQUANT_AI_PROVIDER\s*=\s*zhipu\b/i
  },
  {
    name: "glm-model",
    pattern: /\bLIGHTQUANT_AI_MODEL\s*=\s*glm[-_.a-z0-9]*/i
  }
];

const findings = [];

for (const file of listFiles(root)) {
  const rel = normalize(relative(root, file));
  if (ignoredFiles.has(rel) || isBinaryFile(rel)) {
    continue;
  }

  const content = readFileSync(file, "utf8");
  for (const forbidden of forbiddenPatterns) {
    const match = content.match(forbidden.pattern);
    if (!match || match.index === undefined) {
      continue;
    }

    findings.push({
      file: rel,
      rule: forbidden.name,
      line: lineNumberAt(content, match.index)
    });
  }
}

if (findings.length > 0) {
  console.error("Legacy AI configuration references were found:");
  console.error(JSON.stringify(findings, null, 2));
  process.exit(1);
}

console.log("Legacy AI configuration check passed.");

function* listFiles(directory) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      yield* listFiles(fullPath);
      continue;
    }

    if (stats.isFile()) {
      yield fullPath;
    }
  }
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function normalize(value) {
  return value.replaceAll("\\", "/");
}

function isBinaryFile(file) {
  const lower = file.toLowerCase();
  for (const ext of allowedBinaryExtensions) {
    if (lower.endsWith(ext)) {
      return true;
    }
  }

  return false;
}
