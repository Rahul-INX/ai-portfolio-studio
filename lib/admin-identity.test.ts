import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedAdminEmail } from "@/lib/admin-identity";

describe("isAllowedAdminEmail", () => {
  it("allows only the exact configured owner email", () => {
    assert.equal(isAllowedAdminEmail("Owner@Example.com", "owner@example.com"), true);
    assert.equal(isAllowedAdminEmail("attacker@example.com", "owner@example.com"), false);
    assert.equal(isAllowedAdminEmail("owner@example.com.attacker.test", "owner@example.com"), false);
    assert.equal(isAllowedAdminEmail("owner@example.com", undefined), false);
  });
});
