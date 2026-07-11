import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const frontendRoots = [
  path.join(root, "src", "app"),
  path.join(root, "src", "components"),
  path.join(root, "src", "lib")
];
const forbiddenFrontendPatterns = [
  /继续输出/,
  /继续生成/,
  /继续补全/,
  /补全剩余/,
  /接着写/,
  /从断点继续/,
  /continuationAvailable/,
  /continueOutput/,
  /handleSubmit\(\{\s*continuation/
];

async function main() {
  const frontendFiles = (await Promise.all(frontendRoots.map((directory) => listSourceFiles(directory)))).flat();
  const frontendViolations: string[] = [];

  for (const file of frontendFiles) {
    const content = await readFile(file, "utf8");

    for (const pattern of forbiddenFrontendPatterns) {
      if (pattern.test(content)) {
        frontendViolations.push(`${path.relative(root, file)} matches ${pattern}`);
      }
    }
  }

  if (frontendViolations.length > 0) {
    throw new Error(`Frontend continuation entry remains:\n${frontendViolations.join("\n")}`);
  }

  const aiService = await readFile(path.join(root, "src", "server", "ai", "ai-service.ts"), "utf8");

  expect("ai-service no longer imports buildContinuationDraft", !/buildContinuationDraft/.test(aiService));
  expect("ai-service disables continuation normalization bypass", /allowContinuationWithoutCode:\s*false/.test(aiService));
  expect("ai-service records continuation false", /continuation:\s*false/.test(aiService));

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "frontend has no user-visible continuation entry strings",
      "frontend has no continuation submit branch",
      "ai-service no longer uses previousTail continuation draft path"
    ]
  }, null, 2));
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [fullPath] : [];
  }));

  return files.flat();
}

function expect(label: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error(`Expected ${label}`);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
});
