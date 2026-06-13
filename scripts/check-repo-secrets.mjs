import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative as relativePath } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const targets = [
  ".env.example",
  ".editorconfig",
  ".gitattributes",
  "docs",
  "deploy",
  "prisma",
  "scripts",
  "src",
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "tailwind.config.ts"
];
const ignoredDirectories = new Set([".git", ".next", "node_modules", "dist", "build", "coverage", "src/generated"]);
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json", ".prisma", ".sql", ".sh", ".example", ".editorconfig", ".gitattributes"]);

const failures = [];

for (const file of targets.flatMap((target) => listFiles(join(projectRoot, target)))) {
  const content = readFileSync(file, "utf8");

  checkPrivateKey(file, content);
  checkDatabaseUrls(file, content);
  if (isEnvLikeFile(file)) {
    checkEnvAssignments(file, content);
  }
}

if (failures.length > 0) {
  console.error("Repository secret check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Repository secret check passed.");

function checkPrivateKey(file, content) {
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) {
    failures.push(`${relative(file)} contains a private key PEM block`);
  }
}

function checkDatabaseUrls(file, content) {
  const matches = content.matchAll(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi);

  for (const match of matches) {
    const value = match[0];

    if (isAllowedDatabaseUrlExample(value)) {
      continue;
    }

    failures.push(`${relative(file)} contains a non-placeholder PostgreSQL URL`);
  }
}

function checkEnvAssignments(file, content) {
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsAt = trimmed.indexOf("=");
    const name = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim();

    if (!/^[A-Z0-9_]+$/.test(name)) {
      continue;
    }

    if (!looksSensitiveName(name) || !value || looksLikePlaceholder(value)) {
      continue;
    }

    failures.push(`${relative(file)} has a non-placeholder sensitive assignment for ${name}`);
  }
}

function isAllowedDatabaseUrlExample(value) {
  return value.includes("USER:PASSWORD@HOST") || value.includes("***") || value.includes("localhost") || value.includes("127.0.0.1");
}

function looksSensitiveName(name) {
  return /(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_KEY|TOKEN|DATABASE_URL|AUTH_SECRET)$/i.test(name);
}

function looksLikePlaceholder(value) {
  return (
    value === "" ||
    value.startsWith("replace-with-") ||
    value.includes("USER:PASSWORD@HOST") ||
    value.includes("***") ||
    value.includes("YOUR_") ||
    value.includes("example") ||
    value === "null"
  );
}

function listFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  const stat = statSync(path);

  if (stat.isFile()) {
    return shouldCheck(path) ? [path] : [];
  }

  if (ignoredDirectories.has(relative(path))) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => listFiles(join(path, entry.name)));
}

function shouldCheck(path) {
  return allowedExtensions.has(extname(path)) || path.endsWith(".env.example") || path.endsWith(".editorconfig") || path.endsWith(".gitattributes");
}

function isEnvLikeFile(path) {
  return relative(path) === ".env.example";
}

function relative(path) {
  return relativePath(projectRoot, path).replaceAll("\\", "/");
}
