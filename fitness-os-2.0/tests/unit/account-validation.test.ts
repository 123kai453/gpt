import { describe, it, expect } from "vitest";
import { consentSchema, mutationSchema, preferencesPatchSchema, profilePatchSchema } from "../../src/lib/account/validation";

describe("account mutation validation", () => {
  it("rejects forged ownership, version injection and empty updates", () => {
    for (const patch of [{id: "another-user"}, {user_id: "another-user"}, {version: 99}, {}, {deletion_requested_at: "now"}]) {
      expect(profilePatchSchema.safeParse(patch).success).toBe(false);
    }
    expect(profilePatchSchema.parse({display_name: "  长期进步  "})).toEqual({display_name: "长期进步"});
  });
  it("validates mutation identity and base version without coercion", () => {
    const valid = { mutationId: "11111111-1111-4111-8111-111111111111", deviceId: "22222222-2222-4222-8222-222222222222", entity: "profile", baseVersion: 1, patch: {username: "runner_1"} };
    expect(mutationSchema.safeParse(valid).success).toBe(true);
    for (const v of [{...valid,baseVersion:0}, {...valid,baseVersion:"1"}, {...valid,mutationId:"x"}, {...valid,user_id:"forged"}, {...valid,entity:"health"}]) expect(mutationSchema.safeParse(v).success).toBe(false);
  });
  it("checks real IANA zones, notification fields, enum values and consent scope", () => {
    expect(preferencesPatchSchema.safeParse({timezone:"Asia/Shanghai",notification_preferences:{email:false,push:true}}).success).toBe(true);
    for (const patch of [{timezone:"Mars/Olympus"}, {theme:"auto"}, {notification_preferences:{email:true,push:false,tracking:true}}]) expect(preferencesPatchSchema.safeParse(patch).success).toBe(false);
    expect(consentSchema.safeParse({scope:"health_data",granted:false,policy_version:"2026-11"}).success).toBe(true);
    expect(consentSchema.safeParse({scope:"publish_all_data",granted:true,policy_version:"1"}).success).toBe(false);
  });
});
