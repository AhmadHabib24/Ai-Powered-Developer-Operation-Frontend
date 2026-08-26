import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["draft", "planning", "active", "on_hold", "completed", "archived"]).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  estimated_hours: z.coerce.number().min(0).optional(),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
});

export const workModeSchema = z.object({
  work_mode: z.enum(["office", "remote"]),
});

export const timeAdjustSchema = z.object({
  delta_seconds: z.coerce.number().int().refine((value) => value !== 0, "Adjustment cannot be zero"),
  reason: z.string().min(3, "Reason is required"),
});

export const projectRuleSchema = z.object({
  title: z.string().min(2, "Title is required"),
  rule_text: z.string().min(8, "Describe the rule"),
  category: z.enum(["architecture", "security", "style", "testing", "performance"]),
  stack: z.enum(["laravel", "nextjs", "general"]).optional(),
});

export const novaChatSchema = z.object({
  message: z.string().min(1, "Enter a message").max(4000),
});

export const performanceRuleSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores"),
  points: z.coerce.number().int(),
});

export const awardPointsSchema = z.object({
  user_id: z.coerce.number().int().positive("Choose a person"),
  rule_id: z.coerce.number().int().positive("Choose a rule"),
  reason: z.string().min(3, "Reason is required"),
});
