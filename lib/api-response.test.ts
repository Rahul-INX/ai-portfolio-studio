import assert from "node:assert/strict";
import test from "node:test";
import { readApiResponse } from "@/lib/api-response";

test("returns a successful JSON payload", async () => {
  const response = Response.json({ url: "https://example.com/image.png" });
  const payload = await readApiResponse<{ url: string }>(response);
  assert.equal(payload.url, "https://example.com/image.png");
});

test("surfaces structured API messages and request references", async () => {
  const response = Response.json(
    {
      error: "Failed to publish content.",
      message: "The database is temporarily unavailable.",
      requestId: "publish-123",
    },
    { status: 503 },
  );

  await assert.rejects(
    () => readApiResponse(response),
    /The database is temporarily unavailable\. Reference: publish-123\./,
  );
});

test("handles an empty non-JSON production error response", async () => {
  const response = new Response("", {
    status: 500,
    statusText: "Internal Server Error",
  });

  await assert.rejects(() => readApiResponse(response), /Internal Server Error/);
});

test("identifies an expired admin session", async () => {
  const response = Response.json({ error: "Unauthorized" }, { status: 401 });
  await assert.rejects(
    () => readApiResponse(response),
    /Your admin session has expired/,
  );
});
