import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, createNonce, STATIC_SECURITY_HEADERS } from "./securityHeaders";

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );

describe("createNonce", () => {
  it("is base64, at least 128 bits, and never repeats", () => {
    const nonces = new Set(Array.from({ length: 1000 }, () => createNonce()));
    expect(nonces.size).toBe(1000);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});

describe("buildContentSecurityPolicy (production)", () => {
  const policy = directives(buildContentSecurityPolicy("abc123", { dev: false }));

  it("only runs scripts carrying this request's nonce", () => {
    expect(policy["script-src"]).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(policy["script-src"]).not.toContain("'unsafe-inline'");
    expect(policy["script-src"]).not.toContain("'unsafe-eval'");
  });

  // A nonce in style-src would make browsers ignore 'unsafe-inline' and block
  // every server-rendered style="" attribute.
  it("allows inline styles without a style nonce", () => {
    expect(policy["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it("forbids framing, plugins, foreign form targets and base-URL hijacks", () => {
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
  });

  it("lets the browser talk only to this app", () => {
    expect(policy["connect-src"]).toEqual(["'self'"]);
  });
});

describe("buildContentSecurityPolicy (development)", () => {
  it("adds only what the dev server needs", () => {
    const policy = directives(buildContentSecurityPolicy("abc123", { dev: true }));
    expect(policy["script-src"]).toContain("'unsafe-eval'");
    expect(policy["connect-src"]).toEqual(["'self'", "ws:", "wss:"]);
  });
});

describe("STATIC_SECURITY_HEADERS", () => {
  it("covers sniffing, framing, referrers and browser features", () => {
    const byName = Object.fromEntries(STATIC_SECURITY_HEADERS.map((h) => [h.key, h.value]));
    expect(byName["X-Content-Type-Options"]).toBe("nosniff");
    expect(byName["X-Frame-Options"]).toBe("DENY");
    expect(byName["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byName["Permissions-Policy"]).toContain("camera=()");
  });
});
