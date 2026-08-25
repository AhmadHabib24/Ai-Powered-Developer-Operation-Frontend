import assert from "node:assert/strict";
import { test } from "node:test";
import { awardPointsSchema, loginSchema, novaChatSchema, performanceRuleSchema, projectRuleSchema, projectSchema, taskSchema, timeAdjustSchema, workModeSchema } from "../schemas/auth";

test("login schema rejects invalid email", () => {
  const result = loginSchema.safeParse({ email: "not-an-email", password: "password" });
  assert.equal(result.success, false);
});

test("login schema accepts valid credentials", () => {
  const result = loginSchema.safeParse({ email: "cto@nova.test", password: "password" });
  assert.equal(result.success, true);
});

test("project schema requires a name", () => {
  assert.equal(projectSchema.safeParse({ name: "A" }).success, false);
  assert.equal(projectSchema.safeParse({ name: "CRM" }).success, true);
});

test("task schema requires a title", () => {
  assert.equal(taskSchema.safeParse({ title: "" }).success, false);
  assert.equal(taskSchema.safeParse({ title: "Auth module", priority: "high" }).success, true);
});

test("work mode schema accepts office or remote", () => {
  assert.equal(workModeSchema.safeParse({ work_mode: "office" }).success, true);
  assert.equal(workModeSchema.safeParse({ work_mode: "hybrid" }).success, false);
});

test("project rule schema requires a title and explanation", () => {
  assert.equal(projectRuleSchema.safeParse({ title: "A", rule_text: "short", category: "security" }).success, false);
  assert.equal(
    projectRuleSchema.safeParse({
      title: "No secrets",
      rule_text: "Never commit API keys.",
      category: "security",
      stack: "general",
    }).success,
    true,
  );
});

test("time adjustment requires a non-zero delta and a reason", () => {
  assert.equal(timeAdjustSchema.safeParse({ delta_seconds: 0, reason: "typo" }).success, false);
  assert.equal(timeAdjustSchema.safeParse({ delta_seconds: 600, reason: "Forgot to start" }).success, true);
});

test("nova chat schema requires a message", () => {
  assert.equal(novaChatSchema.safeParse({ message: "" }).success, false);
  assert.equal(novaChatSchema.safeParse({ message: "Status of CRM?" }).success, true);
});

test("performance rule schema requires a slug", () => {
  assert.equal(performanceRuleSchema.safeParse({ name: "Bonus", slug: "Bad Slug", points: 2 }).success, false);
  assert.equal(performanceRuleSchema.safeParse({ name: "Bonus", slug: "docs_bonus", points: 2 }).success, true);
});

test("award points schema requires a reason", () => {
  assert.equal(awardPointsSchema.safeParse({ user_id: 1, rule_id: 1, reason: "ab" }).success, false);
  assert.equal(awardPointsSchema.safeParse({ user_id: 1, rule_id: 1, reason: "Wrote the API docs" }).success, true);
});
