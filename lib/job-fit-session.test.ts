import assert from "node:assert/strict";
import test from "node:test";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

test("reads a Job Fit session from a normal multi-cookie request", () => {
  const request = new Request("https://portfolio.test", { headers: { cookie: "theme=dark; job_fit_session=session%20id; other=value" } });
  assert.equal(jobFitSessionFrom(request), "session id");
});
