import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedApiKey = {
  encryptedValue: string;
  iv: string;
  authTag: string;
};

function encryptionKey() {
  const value = process.env.AI_KEYS_ENCRYPTION_KEY;
  if (!value) throw new Error("AI_KEYS_ENCRYPTION_KEY is required.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("AI_KEYS_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptApiKey(value: string): EncryptedApiKey {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    encryptedValue: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptApiKey(value: EncryptedApiKey): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(value.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function keyHint(value: string) {
  return value.slice(-4).padStart(4, "•");
}
