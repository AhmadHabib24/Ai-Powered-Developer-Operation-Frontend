import assert from "node:assert/strict";
import { test } from "node:test";
import { bottomNavItems, isNavActive, mobilePageTitle, visibleNavLinks } from "../lib/nav";

const cto = (permission: string) =>
  ["reports.view", "projects.view", "time.view", "ai.use", "settings.manage"].includes(permission);
const developer = (permission: string) => ["projects.view", "time.view", "ai.use"].includes(permission);

test("bottom nav for CTO starts at command home and ends with NOVA", () => {
  const items = bottomNavItems(cto);
  assert.equal(items[0]?.href, "/dashboard");
  assert.equal(items[0]?.label, "Home");
  assert.deepEqual(
    items.map((item) => item.href),
    ["/dashboard", "/projects", "/time", "/nova"],
  );
});

test("bottom nav for a developer starts at my work", () => {
  const items = bottomNavItems(developer);
  assert.equal(items[0]?.href, "/me");
  assert.ok(visibleNavLinks(developer).some((link) => link.href === "/me"));
  assert.equal(
    visibleNavLinks(developer).some((link) => link.href === "/settings"),
    false,
  );
});

test("nav active matching uses prefix without colliding on /me", () => {
  assert.equal(isNavActive("/projects/12", "/projects"), true);
  assert.equal(isNavActive("/performance", "/me"), false);
  assert.equal(mobilePageTitle("/projects/12/reviews/3", "NOVA", "NOVA"), "Projects");
  assert.equal(mobilePageTitle("/nova", "NOVA", "AURA"), "AURA");
});
