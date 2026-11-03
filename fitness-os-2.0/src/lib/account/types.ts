export type Entity = "profile" | "preferences";
export type Profile = {
  id: string; username: string | null; display_name: string; avatar_path: string | null;
  version: number; created_at: string; updated_at: string; deletion_requested_at: string | null;
};
export type Preferences = {
  user_id: string; theme: "dark" | "light"; language: "zh-CN" | "en";
  unit_system: "metric" | "imperial"; timezone: string;
  notification_preferences: { email: boolean; push: boolean };
  version: number; created_at: string; updated_at: string;
};
export type AccountRecord = Profile | Preferences;
export type AccountSnapshot = { profile: Profile; preferences: Preferences };
export type Mutation = {
  mutationId: string; deviceId: string; entity: Entity; baseVersion: number;
  patch: Record<string, unknown>;
};
export type MutationResult = {
  status: "applied" | "conflict"; entity: Entity; record: AccountRecord;
  version: number; mutation_id: string;
};
export type MediaRecord = {
  id: string; user_id: string; object_path: string; mime_type: string; size_bytes: number;
  status: "pending" | "ready" | "deleting" | "failed"; created_at: string; updated_at: string;
};
