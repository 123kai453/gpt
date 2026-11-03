import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("请输入有效的邮箱地址。").max(254, "邮箱地址过长。");
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码。").max(128, "密码过长。"),
});
export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(12, "密码至少需要 12 个字符。").max(128, "密码不能超过 128 个字符。"),
  displayName: z.string().trim().max(64, "称呼不能超过 64 个字符。"),
});
export const resetPasswordSchema = z.object({
  password: z.string().min(12, "密码至少需要 12 个字符。").max(128, "密码不能超过 128 个字符。"),
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, { message: "两次输入的密码不一致。", path: ["confirmation"] });
