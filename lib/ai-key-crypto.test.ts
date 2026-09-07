import assert from "node:assert/strict";
import test from "node:test";
import { decryptApiKey, encryptApiKey, keyHint } from "./ai-key-crypto";

test("encrypts provider keys without retaining plaintext and decrypts exactly", () => {
  process.env.AI_KEYS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const encrypted = encryptApiKey("provider-secret-1234");

  assert.equal(decryptApiKey(encrypted), "provider-secret-1234");
  assert.equal(JSON.stringify(encrypted).includes("provider-secret-1234"), false);
  assert.equal(keyHint("provider-secret-1234"), "1234");
});

test("rejects a missing or malformed encryption key", () => {
  delete process.env.AI_KEYS_ENCRYPTION_KEY;
  assert.throws(() => encryptApiKey("secret"), /AI_KEYS_ENCRYPTION_KEY/);

  process.env.AI_KEYS_ENCRYPTION_KEY = Buffer.alloc(12).toString("base64");
  assert.throws(() => encryptApiKey("secret"), /32 bytes/);
});
