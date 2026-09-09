import assert from "node:assert/strict";
import test from "node:test";
import { jobFitShareTokenHash, newJobFitShareToken } from "@/lib/job-fit-data-crypto";

test("generates opaque non-deterministic Job Fit share tokens and stores only their hash", () => {
  const first = newJobFitShareToken(); const second = newJobFitShareToken();
  assert.notEqual(first, second);
  assert.equal(jobFitShareTokenHash(first).includes(first), false);
  assert.equal(jobFitShareTokenHash(first), jobFitShareTokenHash(first));
});
