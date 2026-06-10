import assert from "node:assert/strict";
import test from "node:test";
import {
  getMimeTypeByExtension,
  MAX_DATABASE_FILE_SIZE,
  requestIsTooLarge,
  safeFileName,
  storedFileUrl,
} from "@/lib/stored-files";

test("builds a database file URL", () => {
  assert.equal(storedFileUrl("file id"), "/api/files/file%20id");
});

test("sanitizes unsafe download names", () => {
  assert.equal(safeFileName('../bad\\"name.pdf', "file"), "..-bad--name.pdf");
});

test("rejects requests that exceed file size plus multipart overhead", () => {
  const request = new Request("https://example.com/api/media", {
    headers: { "content-length": String(MAX_DATABASE_FILE_SIZE + 200_000) },
  });
  assert.equal(requestIsTooLarge(request), true);
});

test("infers supported mime types from file extensions", () => {
  assert.equal(getMimeTypeByExtension("demo.DOCX"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.equal(getMimeTypeByExtension("cover.jpeg"), "image/jpeg");
  assert.equal(getMimeTypeByExtension("archive.bin"), null);
});
