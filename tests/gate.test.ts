import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { gate, homeFor } from "../lib/auth/gate.ts";
import type { Viewer } from "../lib/auth/gate.ts";

const USER: Viewer = { role: "REGISTERED_USER", status: "NON_CLIENT" };
const CLIENT: Viewer = { role: "REGISTERED_USER", status: "CLIENT" };
const TEAM: Viewer = { role: "TEAM_MEMBER", status: "NON_CLIENT" };
const ADMIN: Viewer = { role: "ADMIN", status: "NON_CLIENT" };

describe("homeFor", () => {
  it("sends each role to its own dashboard", () => {
    assert.equal(homeFor(ADMIN), "/admin");
    assert.equal(homeFor(TEAM), "/team");
    assert.equal(homeFor(CLIENT), "/dashboard");
    assert.equal(homeFor(USER), "/dashboard");
  });
});

describe("gate", () => {
  it("sends a visitor with no session to the login page", () => {
    for (const pathname of ["/dashboard", "/team", "/dashboard/client/projects"]) {
      const decision = gate({ pathname, hasToken: false, viewer: null });
      assert.equal(decision.redirectTo, "/login", pathname);
      assert.equal(decision.clearCookie, false);
    }
  });

  /* The admin area keeps its own form, which says staff accounts are not made
     there. Sending someone to the public login would lose that. */
  it("sends an unauthenticated admin request to the admin login", () => {
    assert.equal(gate({ pathname: "/admin", hasToken: false, viewer: null }).redirectTo, "/admin/login");
    assert.equal(
      gate({ pathname: "/admin/clients", hasToken: false, viewer: null }).redirectTo,
      "/admin/login",
    );
  });

  it("lets any signed-in visitor through a gated path", () => {
    for (const viewer of [USER, CLIENT, TEAM, ADMIN]) {
      assert.equal(gate({ pathname: "/dashboard", hasToken: true, viewer }).redirectTo, null);
    }
  });

  /* Authorisation is the data access layer's job, against the live row. The
     proxy deliberately does not decide it — a client activated a moment ago
     still carries NON_CLIENT in their token, and turning them away here would
     mean they had to sign out and back in to reach their own dashboard. */
  it("does not decide who may enter which area", () => {
    assert.equal(gate({ pathname: "/admin", hasToken: true, viewer: USER }).redirectTo, null);
    assert.equal(
      gate({ pathname: "/dashboard/client", hasToken: true, viewer: USER }).redirectTo,
      null,
    );
  });

  it("leaves public paths alone", () => {
    for (const pathname of ["/", "/book", "/contact"]) {
      assert.equal(gate({ pathname, hasToken: false, viewer: null }).redirectTo, null, pathname);
    }
  });

  it("skips the auth forms for someone already signed in", () => {
    assert.equal(gate({ pathname: "/login", hasToken: true, viewer: ADMIN }).redirectTo, "/admin");
    assert.equal(gate({ pathname: "/signup", hasToken: true, viewer: TEAM }).redirectTo, "/team");
    assert.equal(
      gate({ pathname: "/admin/login", hasToken: true, viewer: CLIENT }).redirectTo,
      "/dashboard",
    );
  });

  it("shows the auth forms to a visitor with no cookie", () => {
    const decision = gate({ pathname: "/login", hasToken: false, viewer: null });
    assert.equal(decision.redirectTo, null);
    assert.equal(decision.clearCookie, false);
  });

  /* The regression. A cookie that no longer verifies — rotated secret, expired,
     forged — used to count as signed in, so /admin/login redirected to /admin,
     the data access layer redirected back, and the browser gave up with
     ERR_TOO_MANY_REDIRECTS instead of showing the form. */
  it("treats a cookie that no longer verifies as signed out", () => {
    const dashboard = gate({ pathname: "/admin", hasToken: true, viewer: null });
    assert.equal(dashboard.redirectTo, "/admin/login");
    assert.equal(dashboard.clearCookie, true);

    const login = gate({ pathname: "/admin/login", hasToken: true, viewer: null });
    assert.equal(login.redirectTo, null, "a stale cookie must not bounce back to /admin");
    assert.equal(login.clearCookie, true);
  });

  it("clears a stale cookie even on a public path", () => {
    assert.equal(gate({ pathname: "/", hasToken: true, viewer: null }).clearCookie, true);
  });
});
