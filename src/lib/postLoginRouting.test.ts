import { describe, it, expect } from "vitest";
import { getRedirectPath } from "./getRedirectPath";

/**
 * Verifies the post-login redirect contract for every role.
 * Doctor + superadmin → /admin (never slug-prefixed, never 404).
 * Patient/user → / (or doctor-scoped public path when applicable).
 */
describe("post-login routing by role", () => {
  it("superadmin lands on /admin", () => {
    expect(
      getRedirectPath({ explicit: null, isAdmin: true, doctorSlug: null }),
    ).toBe("/admin");
  });

  it("doctor lands on /admin even when slug is known", () => {
    expect(
      getRedirectPath({ explicit: null, isAdmin: true, doctorSlug: "ahmed" }),
    ).toBe("/admin");
  });

  it("patient/user with no slug lands on /", () => {
    expect(
      getRedirectPath({ explicit: null, isAdmin: false, doctorSlug: null }),
    ).toBe("/");
  });

  it("admin paths are never rewritten to /:slug/admin (404 regression)", () => {
    const cases = ["/admin", "/admin/clinics", "/admin/doctors", "/dashboard"];
    for (const explicit of cases) {
      const out = getRedirectPath({
        explicit,
        isAdmin: true,
        doctorSlug: "any-slug",
      });
      expect(out).toBe(explicit);
      expect(out).not.toMatch(/^\/[^/]+\/(admin|dashboard)/);
    }
  });
});
