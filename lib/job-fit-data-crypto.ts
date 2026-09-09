import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedJobFitData = {
  encryptedValue: string;
  iv: string;
  authTag: string;
};

function dataKey() {
  const value = process.env.JOB_FIT_DATA_ENCRYPTION_KEY;
  if (!value) throw new Error("JOB_FIT_DATA_ENCRYPTION_KEY is required for persistent Job Fit data.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("JOB_FIT_DATA_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptJobFitData(value: string): EncryptedJobFitData {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dataKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return { encryptedValue: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function decryptJobFitData(value: EncryptedJobFitData) {
  const decipher = createDecipheriv("aes-256-gcm", dataKey(), Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(value.encryptedValue, "base64")), decipher.final()]).toString("utf8");
}

export function jobFitSessionHash(value: string) {
  return createHash("sha256").update(`${process.env.JOB_FIT_DATA_ENCRYPTION_KEY ?? "no-persistence-key"}:${value}`).digest("hex");
}

export function newJobFitShareToken() {
  return randomBytes(32).toString("base64url");
}

export function jobFitShareTokenHash(value: string) {
  return createHash("sha256").update(`${process.env.JOB_FIT_DATA_ENCRYPTION_KEY ?? "no-persistence-key"}:${value}`).digest("hex");
}
