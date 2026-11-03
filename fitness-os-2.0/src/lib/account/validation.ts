import { z } from "zod";
const timezone = z.string().max(80).refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}, "请选择有效的 IANA 时区");
export const profilePatchSchema = z.object({
  display_name: z.string().trim().min(1).max(64).optional(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/).nullable().optional(),
  avatar_path: z.string().max(300).nullable().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "至少修改一个字段");
export const preferencesPatchSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(), language: z.enum(["zh-CN", "en"]).optional(),
  unit_system: z.enum(["metric", "imperial"]).optional(), timezone: timezone.optional(),
  notification_preferences: z.object({ email: z.boolean(), push: z.boolean() }).strict().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "至少修改一个字段");
const mutationBase = { mutationId: z.uuid(), deviceId: z.uuid(), baseVersion: z.number().int().positive() };
export const mutationSchema = z.discriminatedUnion("entity", [
  z.object({ ...mutationBase, entity: z.literal("profile"), patch: profilePatchSchema }).strict(),
  z.object({ ...mutationBase, entity: z.literal("preferences"), patch: preferencesPatchSchema }).strict(),
]);
export const consentSchema = z.object({ scope: z.enum(["privacy_policy", "terms", "analytics", "health_data"]), granted: z.boolean(), policy_version: z.string().regex(/^[a-zA-Z0-9._-]{1,40}$/) }).strict();
