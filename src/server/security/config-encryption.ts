import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_ENV_NAMES = ["CONFIG_ENCRYPTION_KEY", "APP_CONFIG_ENCRYPTION_KEY"] as const;

type EncryptedPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
};

export function isConfigEncryptionConfigured() {
  return Boolean(readEncryptionKey(false));
}

export function encryptConfigSecret(plainText: string) {
  const key = readEncryptionKey(true);
  if (!key) {
    throw new Error("CONFIG_ENCRYPTION_KEY is required");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64")
  };

  return JSON.stringify(payload);
}

export function decryptConfigSecret(encryptedValue: string) {
  const key = readEncryptionKey(true);
  if (!key) {
    throw new Error("CONFIG_ENCRYPTION_KEY is required");
  }
  const payload = JSON.parse(encryptedValue) as EncryptedPayload;

  if (payload.v !== 1 || payload.alg !== "aes-256-gcm") {
    throw new Error("Unsupported encrypted config secret format");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function readEncryptionKey(required: boolean): Buffer | null {
  const raw = ENCRYPTION_ENV_NAMES
    .map((envName) => process.env[envName]?.trim())
    .find(Boolean);

  if (!raw) {
    if (required) {
      throw new Error("CONFIG_ENCRYPTION_KEY is required");
    }

    return null;
  }

  try {
    const key = Buffer.from(raw, "base64");

    if (key.length !== 32) {
      throw new Error("CONFIG_ENCRYPTION_KEY must decode to 32 bytes");
    }

    return key;
  } catch (error) {
    if (required) {
      throw error;
    }

    return null;
  }
}
