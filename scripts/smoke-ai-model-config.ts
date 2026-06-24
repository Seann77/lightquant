import { randomBytes } from "crypto";
import { ServerConfigError } from "../src/server/env";

process.env.LIGHTQUANT_DATA_MODE = "mock";
(process.env as Record<string, string | undefined>).NODE_ENV = "development";
process.env.LIGHTQUANT_AI_PROVIDER = "openai_compatible";
process.env.LIGHTQUANT_AI_BASE_URL = "https://env.example.com/v1";
process.env.LIGHTQUANT_AI_MODEL = "env-model";
process.env.LIGHTQUANT_AI_API_KEY = "env-fallback-key";

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exitCode = 1;
});

async function main() {
  const { encryptConfigSecret, decryptConfigSecret } = await import("../src/server/security/config-encryption");
  const { resolveAiRuntimeConfig } = await import("../src/server/ai/ai-runtime-config");
  const { getRepository } = await import("../src/server/repositories");
  const { MockLightQuantRepository } = await import("../src/server/repositories/mock/mock-repository");

  const encryptionKey = randomBytes(32).toString("base64");
  process.env.CONFIG_ENCRYPTION_KEY = encryptionKey;

  const encrypted = encryptConfigSecret("model-secret-value");
  assert(!encrypted.includes("model-secret-value"), "encrypted payload must not contain plaintext");
  assert(decryptConfigSecret(encrypted) === "model-secret-value", "decrypt must restore plaintext");

  delete process.env.CONFIG_ENCRYPTION_KEY;
  expectServerConfigError(() => encryptConfigSecret("should-fail"), "missing encryption key should fail");
  process.env.CONFIG_ENCRYPTION_KEY = encryptionKey;

  globalThis.__lightquantMockRepository = new MockLightQuantRepository();
  const repository = getRepository();
  const now = new Date().toISOString();
  const secret = await repository.upsertAiModelSecret({
    name: "Smoke MIMO Key",
    provider: "openai_compatible",
    encryptedValue: encryptConfigSecret("db-secret-key"),
    keyHint: null,
    createdAt: now,
    updatedAt: now
  });
  const profile = await repository.createAiModelProfile({
    name: "Smoke MIMO",
    provider: "openai_compatible",
    baseUrl: "https://db.example.com/v1",
    model: "db-model",
    supportsVision: false,
    apiKeyEnvName: null,
    apiKeySecretId: secret.id,
    enabled: true,
    createdAt: now,
    updatedAt: now
  });
  await repository.setActiveAiModelProfile({
    profileId: profile.id,
    updatedAt: now
  });

  const dbConfig = await resolveAiRuntimeConfig();
  assert(dbConfig.source === "database profile", "active profile must win over env");
  assert(dbConfig.apiKey === "db-secret-key", "runtime must decrypt database secret");
  assert(dbConfig.model === "db-model", "runtime must use profile model");

  globalThis.__lightquantMockRepository = new MockLightQuantRepository();
  const failClosedRepository = getRepository();
  const brokenProfile = await failClosedRepository.createAiModelProfile({
    name: "Broken Profile",
    provider: "openai_compatible",
    baseUrl: "https://broken.example.com/v1",
    model: "broken-model",
    supportsVision: false,
    apiKeyEnvName: null,
    apiKeySecretId: null,
    enabled: true,
    createdAt: now,
    updatedAt: now
  });
  await failClosedRepository.setActiveAiModelProfile({
    profileId: brokenProfile.id,
    updatedAt: now
  });
  await expectAsyncServerConfigError(() => resolveAiRuntimeConfig(), "active profile without key must fail closed");

  globalThis.__lightquantMockRepository = new MockLightQuantRepository();
  const envConfig = await resolveAiRuntimeConfig();
  assert(envConfig.source === "env", "without active profile runtime must fallback to env");
  assert(envConfig.apiKey === "env-fallback-key", "env fallback must use env API key");
  assert(envConfig.model === "env-model", "env fallback must use env model");

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "encrypt/decrypt roundtrip",
      "missing encryption key guard",
      "active profile database secret runtime",
      "active profile missing key fail closed",
      "env fallback without active profile"
    ]
  }, null, 2));
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectServerConfigError(fn: () => unknown, message: string) {
  try {
    fn();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      return;
    }

    throw error;
  }

  throw new Error(message);
}

async function expectAsyncServerConfigError(fn: () => Promise<unknown>, message: string) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      return;
    }

    throw error;
  }

  throw new Error(message);
}
