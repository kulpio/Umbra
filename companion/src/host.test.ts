import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedLoopbackHost } from "./host.js";

describe("isAllowedLoopbackHost", () => {
  it("allows 127.0.0.1:8787 and localhost:8787", () => {
    assert.equal(isAllowedLoopbackHost("127.0.0.1:8787", 8787), true);
    assert.equal(isAllowedLoopbackHost("localhost:8787", 8787), true);
    assert.equal(isAllowedLoopbackHost("127.0.0.1:8787", 8787), true);
  });

  it("is case-insensitive and trims", () => {
    assert.equal(isAllowedLoopbackHost("  LOCALHOST:8787  ", 8787), true);
  });

  it("rejects foreign Host (DNS rebinding)", () => {
    assert.equal(isAllowedLoopbackHost("evil.example", 8787), false);
    assert.equal(isAllowedLoopbackHost("evil.example:8787", 8787), false);
    assert.equal(isAllowedLoopbackHost("attacker.com:443", 8787), false);
  });

  it("rejects wrong port", () => {
    assert.equal(isAllowedLoopbackHost("127.0.0.1:9999", 8787), false);
    assert.equal(isAllowedLoopbackHost("localhost:80", 8787), false);
  });

  it("rejects missing host", () => {
    assert.equal(isAllowedLoopbackHost(undefined, 8787), false);
    assert.equal(isAllowedLoopbackHost("", 8787), false);
  });

  it("rejects bare 127.0.0.1 when not port 80", () => {
    assert.equal(isAllowedLoopbackHost("127.0.0.1", 8787), false);
    assert.equal(isAllowedLoopbackHost("localhost", 8787), false);
  });
});
