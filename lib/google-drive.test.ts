import assert from "node:assert/strict";
import test from "node:test";
import { driveAuthorizationUrl, driveFolders, findByteIdenticalDriveAsset, googleDriveConfigured } from "@/lib/google-drive";

test("Drive folders cover each CMS media destination", () => {
  assert.deepEqual(driveFolders, ["profile", "projects", "case-studies", "experiments", "blogs", "dashboards", "achievements", "resume", "cv", "supporting"]);
});

test("Drive OAuth requires explicit environment configuration", () => {
  const original = { id: process.env.GOOGLE_DRIVE_CLIENT_ID, secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET, redirect: process.env.GOOGLE_DRIVE_REDIRECT_URI };
  try {
    delete process.env.GOOGLE_DRIVE_CLIENT_ID; delete process.env.GOOGLE_DRIVE_CLIENT_SECRET; delete process.env.GOOGLE_DRIVE_REDIRECT_URI;
    assert.equal(googleDriveConfigured(), false);
    assert.throws(() => driveAuthorizationUrl("state"), /not configured/);
  } finally {
    for (const [key, value] of Object.entries({ GOOGLE_DRIVE_CLIENT_ID: original.id, GOOGLE_DRIVE_CLIENT_SECRET: original.secret, GOOGLE_DRIVE_REDIRECT_URI: original.redirect })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("reuses only a byte-identical Drive asset", async () => {
  const candidates = [
    { id: "wrong", externalId: "drive-wrong" },
    { id: "same", externalId: "drive-same" },
  ];
  const bytes = new Map([
    ["drive-wrong", Buffer.from("different")],
    ["drive-same", Buffer.from("portfolio media")],
  ]);

  assert.equal(
    await findByteIdenticalDriveAsset(Buffer.from("portfolio media"), candidates, async (externalId) => bytes.get(externalId) ?? Buffer.alloc(0)),
    candidates[1],
  );
});
