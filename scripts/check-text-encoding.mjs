import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative as relativePath } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const targets = ["src", "docs", "scripts", "prisma", "deploy", ".env.example", ".editorconfig", ".gitattributes", "package.json"];
const ignoredDirectories = new Set([".git", ".next", "node_modules", "dist", "build", "coverage", "src/generated"]);
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json", ".prisma", ".sql", ".sh", ".example", ".editorconfig"]);

const mojibakeRules = [
  {
    name: "replacement-character",
    pattern: /\uFFFD/u
  },
  {
    name: "private-use-character",
    pattern: /[\uE000-\uF8FF]/u
  },
  {
    name: "classic-gbk-mojibake",
    pattern: /\u951F\u65A4\u62F7/u
  },
  {
    name: "common-chinese-mojibake-sequence",
    pattern: /(?:\u93C0|\u934F|\u9427|\u9422|\u7EC9|\u7EDB|\u5A11|\u6FCA|\u9394|\u9418|\u675E|\u95BF|\u95B8|\u95BB|\u7F01|\u7F02|\u9A9E|\u93C8)[\u4E00-\u9FFF]{1,8}/u
  }
];
const commonMojibakeTokens = [
  {
    name: "common-mojibake-verify-code",
    token: "\u6960\u5c83\u7609"
  },
  {
    name: "common-mojibake-login",
    token: "\u9427\u8bf2\u7d8d"
  },
  {
    name: "common-mojibake-please-first",
    token: "\u7487\u5cf0\u539b"
  },
  {
    name: "common-mojibake-phone",
    token: "\u93b5\u5b2b\u6e80"
  },
  {
    name: "common-mojibake-policy",
    token: "\u93c0\u8de8\u74e5"
  }
];

const failures = [];

for (const file of targets.flatMap((target) => listFiles(join(projectRoot, target)))) {
  const content = readFileSync(file, "utf8");

  for (const rule of mojibakeRules) {
    const match = content.match(rule.pattern);

    if (match) {
      failures.push(`${relative(file)} contains ${rule.name}: ${JSON.stringify(match[0])}`);
    }
  }

  for (const rule of commonMojibakeTokens) {
    if (content.includes(rule.token)) {
      failures.push(`${relative(file)} contains ${rule.name}: ${JSON.stringify(rule.token)}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Text encoding check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Text encoding check passed.");

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

function relative(path) {
  return relativePath(projectRoot, path).replaceAll("\\", "/");
}
