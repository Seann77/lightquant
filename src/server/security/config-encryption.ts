import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { ServerConfigError } from "@/server/env";

type EncryptedPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
};

const ENCRYPTION_KEY_ENV_NAMES = ["CONFIG_ENCRYPTION_KEY", "APP_CONFIG_ENCRYPTION_KEY"] as const;

export function isConfigEncryptionConfigured() {
  return Boolean(getRawEncryptionKey());
}

export function encryptConfigSecret(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };

  return JSON.stringify(payload);
}

export function decryptConfigSecret(encryptedValue: string) {
  const key = getEncryptionKey();
  let payload: EncryptedPayload;

  try {
    payload = JSON.parse(encryptedValue) as EncryptedPayload;
  } catch {
    throw new ServerConfigError("Stored AI model secret is not valid encrypted JSON");
  }

  if (payload.v !== 1 || payload.alg !== "aes-256-gcm" || !payload.iv || !payload.tag || !payload.ciphertext) {
    throw new ServerConfigError("Stored AI model secret format is not supported");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    throw new ServerConfigError("Stored AI model secret cannot be decrypted");
  }
}

function getEncryptionKey() {
  const raw = getRawEncryptionKey();

  if (!raw) {
    throw new ServerConfigError("CONFIG_ENCRYPTION_KEY or APP_CONFIG_ENCRYPTION_KEY is required to write or read database AI model secrets");
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new ServerConfigError("CONFIG_ENCRYPTION_KEY or APP_CONFIG_ENCRYPTION_KEY must be a base64 encoded 32-byte key");
  }

  return key;
}

function getRawEncryptionKey() {
  return ENCRYPTION_KEY_ENV_NAMES.map((name) => process.env[name]?.trim()).find(Boolean) ?? "";
}
