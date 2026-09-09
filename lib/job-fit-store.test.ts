import assert from "node:assert/strict";
import test from "node:test";
import { jobFitEncryptedColumns, jobFitInquiryStatus, jobFitResearchCompletionStatus, jobFitSourceEncryptedColumns } from "@/lib/job-fit-store";

test("marks only successful cited research as a completed Job Fit inquiry", () => {
  assert.equal(jobFitInquiryStatus("complete"), "COMPLETE");
  assert.equal(jobFitInquiryStatus("failed"), "CORE_COMPLETE");
  assert.equal(jobFitInquiryStatus("not-configured"), "CORE_COMPLETE");
});

test("maps encrypted values to the dedicated Job Fit database columns", () => {
  assert.deepEqual(jobFitEncryptedColumns({ encryptedValue: "ciphertext", iv: "iv", authTag: "tag" }), {
    jdEncryptedValue: "ciphertext", jdIv: "iv", jdAuthTag: "tag",
  });
});

test("keeps a private encrypted copy of the original JD attachment", () => {
  assert.deepEqual(jobFitSourceEncryptedColumns({ encryptedValue: "ciphertext", iv: "iv", authTag: "tag" }), {
    sourceEncryptedValue: "ciphertext", sourceIv: "iv", sourceAuthTag: "tag",
  });
});

test("research status cannot claim completion before cited research completes", () => {
  assert.equal(jobFitResearchCompletionStatus("complete"), "COMPLETE");
  assert.equal(jobFitResearchCompletionStatus("failed"), "CORE_COMPLETE");
  assert.equal(jobFitResearchCompletionStatus("not-configured"), "CORE_COMPLETE");
});
