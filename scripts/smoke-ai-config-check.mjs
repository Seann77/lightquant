import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cases = [
  {
    name: "mimo-valid",
    envLines: [
      "LIGHTQUANT_AI_PROVIDER=openai_compatible",
      "LIGHTQUANT_AI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1",
      "LIGHTQUANT_AI_MODEL=mimo-v2.5-pro",
      "LIGHTQUANT_AI_API_KEY=fake-key"
    ],
    expectOk: true
  },
  {
    name: "glm-model-rejected",
    envLines: [
      "LIGHTQUANT_AI_PROVIDER=openai_compatible",
      "LIGHTQUANT_AI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1",
      "LIGHTQUANT_AI_MODEL=glm-4.5-air",
      "LIGHTQUANT_AI_API_KEY=fake-key"
    ],
    expectOk: false,
    expectedError: "LIGHTQUANT_AI_MODEL still points to a GLM model"
  },
  {
    name: "zhipu-key-rejected",
    envLines: [
      "LIGHTQUANT_AI_PROVIDER=openai_compatible",
      "LIGHTQUANT_AI_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1",
      "LIGHTQUANT_AI_MODEL=mimo-v2.5-pro",
      "LIGHTQUANT_AI_API_KEY=fake-key",
      "ZHIPU_API_KEY=legacy-key"
    ],
    expectOk: false,
    expectedError: "ZHIPU_API_KEY is still present"
  },
  {
    name: "zhipu-provider-rejected",
    envLines: [
      "LIGHTQUANT_AI_PROVIDER=zhipu",
      "LIGHTQUANT_AI_MODEL=glm-4.5-air",
      "LIGHTQUANT_AI_API_KEY=fake-key"
    ],
    expectOk: false,
    expectedError: "LIGHTQUANT_AI_PROVIDER must be one of"
  }
];

console.log("LightQuant AI config check smoke test");
console.log(
  JSON.stringify(
    {
      note: "Runs check-ai-config.mjs in temporary directories with fake configuration. It does not read .env.local or print real API keys."
    },
    null,
    2
  )
);

const results = [];

for (const testCase of cases) {
  const directory = mkdtempSync(join(tmpdir(), "lightquant-ai-config-"));

  try {
    writeFileSync(join(directory, ".env.local"), `${testCase.envLines.join("\n")}\n`, "utf8");
    const run = spawnSync(process.execPath, [join(process.cwd(), "scripts/check-ai-config.mjs")], {
      cwd: directory,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "development"
      }
    });
    const output = run.stdout || run.stderr;
    const json = safeParseJson(output);
    const okMatches = testCase.expectOk ? run.status === 0 && json?.ok === true : run.status !== 0 && json?.ok === false;
    const errorMatches = testCase.expectedError ? output.includes(testCase.expectedError) : true;

    results.push({
      name: testCase.name,
      exitCode: run.status,
      ok: Boolean(okMatches && errorMatches),
      reportedOk: json?.ok ?? null,
      matchedError: testCase.expectedError ? errorMatches : null
    });
  } finally {
    rmSync(directory, {
      force: true,
      recursive: true
    });
  }
}

const failed = results.filter((result) => !result.ok);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      results
    },
    null,
    2
  )
);

if (failed.length > 0) {
  process.exitCode = 1;
}

function safeParseJson(output) {
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}
