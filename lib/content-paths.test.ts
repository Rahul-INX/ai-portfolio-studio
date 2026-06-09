import assert from "node:assert/strict";
import test from "node:test";
import { affectedContentPaths } from "@/lib/content-paths";

test("profile edits invalidate every public profile consumer", () => {
  assert.deepEqual(affectedContentPaths("site-profile"), [
    "/",
    "/explorer",
    "/timeline",
    "/cv",
    "/job-fit",
    "/manifest.webmanifest",
    "/opengraph-image",
    "/llms.txt",
    "/llms-full.txt"
  ]);
});

test("project edits invalidate indexes and the project detail route", () => {
  assert.deepEqual(affectedContentPaths("project", "resume-matcher"), [
    "/",
    "/explorer",
    "/project/resume-matcher",
    "/llms.txt",
    "/llms-full.txt"
  ]);
});

test("timeline edits invalidate the timeline and AI-readable routes", () => {
  assert.deepEqual(affectedContentPaths("timeline"), [
    "/timeline",
    "/llms.txt",
    "/llms-full.txt"
  ]);
});
