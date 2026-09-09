import assert from "node:assert/strict";
import test from "node:test";
import { projectProof } from "./project-evidence";

test("derives honest public proof labels without inventing evidence", () => {
  assert.deepEqual(projectProof({ githubUrl: "https://github.com/example/repo", demoUrl: "https://example.com" }), {
    label: "Live demo + public repo",
    tone: "strong"
  });
  assert.equal(projectProof({ githubUrl: undefined, demoUrl: undefined }).label, "No public repo or demo");
});
