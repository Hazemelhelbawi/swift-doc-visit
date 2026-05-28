import { describe, it, expect } from "vitest";
import { getRedirectPath } from "./getRedirectPath";

describe("getRedirectPath", () => {
  it("sends admins to /admin without slug prefix", () => {
    expect(
      getRedirectPath({ explicit: null, isAdmin: true, doctorSlug: "hazem" }),
    ).toBe("/admin");
  });

  it("never rewrites /admin into a slugged path (regression for 404)", () => {
    const out = getRedirectPath({
      explicit: "/admin",
      isAdmin: true,
      doctorSlug: "hazemelhilbawi",
    });
    expect(out).toBe("/admin");
    expect(out).not.toMatch(/^\/[^/]+\/admin/);
    expect(out).not.toContain("doctor=");
  });

  it("preserves nested admin routes unprefixed", () => {
    expect(
      getRedirectPath({
        explicit: "/admin/patients",
        isAdmin: true,
        doctorSlug: "x",
      }),
    ).toBe("/admin/patients");
  });

  it("keeps /dashboard untouched", () => {
    expect(
      getRedirectPath({ explicit: "/dashboard", isAdmin: true, doctorSlug: "x" }),
    ).toBe("/dashboard");
  });

  it("sends non-admins to / by default", () => {
    expect(
      getRedirectPath({ explicit: null, isAdmin: false, doctorSlug: null }),
    ).toBe("/");
  });

  it("appends ?doctor=slug for non-admin custom paths", () => {
    expect(
      getRedirectPath({
        explicit: "/book",
        isAdmin: false,
        doctorSlug: "ahmed",
      }),
    ).toBe("/book?doctor=ahmed");
  });

  it("does not double the query separator", () => {
    expect(
      getRedirectPath({
        explicit: "/services?foo=1",
        isAdmin: false,
        doctorSlug: "ahmed",
      }),
    ).toBe("/services?foo=1&doctor=ahmed");
  });
});
