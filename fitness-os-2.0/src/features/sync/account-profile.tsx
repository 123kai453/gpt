"use client";
import { useState, type FormEvent } from "react";
import { UserRound, SlidersHorizontal } from "lucide-react";
import { useSync } from "./sync-provider";
import { useTheme } from "@/components/layout/theme-provider";
import type { AccountSnapshot } from "@/lib/account/types";
import { preferencesPatchSchema, profilePatchSchema } from "@/lib/account/validation";
import { AccountNotice, messageOf } from "./account-shell";

export function AccountProfile() {
  const sync = useSync();
  if (!sync.snapshot) return <div className="account-panel"><h2>个人资料</h2><p className="account-description">{sync.loading ? "正在读取你的真实账号资料…" : "暂时无法读取资料，请检查网络并重试。"}</p><AccountNotice text={sync.error || ""} error /><button className="button button-secondary button-default" onClick={() => void sync.retry()}>重新读取</button></div>;
  return <ProfileForms key={sync.snapshot.profile.id} initial={sync.snapshot} />;
}
function ProfileForms({ initial }: { initial: AccountSnapshot }) {
  const { enqueue, snapshot, online } = useSync();
  const { setTheme } = useTheme();
  const [displayNameEdit, setDisplayName] = useState<string | null>(null);
  const displayName = displayNameEdit ?? snapshot?.profile.display_name ?? initial.profile.display_name;
  const [usernameEdit, setUsername] = useState<string | null>(null);
  const username = usernameEdit ?? snapshot?.profile.username ?? "";
  const [themeEdit, changeTheme] = useState<"dark" | "light" | null>(null);
  const theme = themeEdit ?? snapshot?.preferences.theme ?? initial.preferences.theme;
  const [languageEdit, setLanguage] = useState<"zh-CN" | "en" | null>(null);
  const language = languageEdit ?? snapshot?.preferences.language ?? initial.preferences.language;
  const [unitsEdit, setUnits] = useState<"metric" | "imperial" | null>(null);
  const units = unitsEdit ?? snapshot?.preferences.unit_system ?? initial.preferences.unit_system;
  const [timezoneEdit, setTimezone] = useState<string | null>(null);
  const timezone = timezoneEdit ?? snapshot?.preferences.timezone ?? initial.preferences.timezone;
  const [emailEdit, setEmail] = useState<boolean | null>(null);
  const email = emailEdit ?? snapshot?.preferences.notification_preferences.email ?? initial.preferences.notification_preferences.email;
  const [pushEdit, setPush] = useState<boolean | null>(null);
  const push = pushEdit ?? snapshot?.preferences.notification_preferences.push ?? initial.preferences.notification_preferences.push;
  const [profileBusy, setProfileBusy] = useState(false);
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [profileNotice, setProfileNotice] = useState({ text: "", error: false });
  const [preferencesNotice, setPreferencesNotice] = useState({ text: "", error: false });
  const queuedText = online ? "更改已加入同步队列。请在同步状态中查看服务器确认结果。" : "更改已安全保存在此设备的待同步队列中，联网后将自动尝试同步。";
  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setProfileNotice({ text: "", error: false });
    const parsed = profilePatchSchema.safeParse({ display_name: displayName, username: username.trim() || null });
    if (!parsed.success) { setProfileNotice({ text: parsed.error.issues[0].message, error: true }); return; }
    setProfileBusy(true);
    try { await enqueue("profile", parsed.data); setDisplayName(null); setUsername(null); setProfileNotice({ text: queuedText, error: false }); }
    catch (error) { setProfileNotice({ text: messageOf(error), error: true }); }
    finally { setProfileBusy(false); }
  }
  async function savePreferences(event: FormEvent) {
    event.preventDefault(); setPreferencesNotice({ text: "", error: false });
    const parsed = preferencesPatchSchema.safeParse({ theme, language, unit_system: units, timezone, notification_preferences: { email, push } });
    if (!parsed.success) { setPreferencesNotice({ text: parsed.error.issues[0].message, error: true }); return; }
    setPreferencesBusy(true);
    try { await enqueue("preferences", parsed.data); setTheme(theme); changeTheme(null); setLanguage(null); setUnits(null); setTimezone(null); setEmail(null); setPush(null); setPreferencesNotice({ text: queuedText, error: false }); }
    catch (error) { setPreferencesNotice({ text: messageOf(error), error: true }); }
    finally { setPreferencesBusy(false); }
  }
  return <div className="account-grid">
    <section className="account-panel"><span className="eyebrow"><UserRound size={14} />PERSONAL PROFILE</span><h2>让每一次进步，都属于你</h2><p className="account-description">资料通过你的账号在手机和电脑之间同步。离线修改会保留在当前设备，等待服务器确认。</p>
      <form className="account-form" onSubmit={saveProfile}>
        <label>显示名称<input name="display_name" autoComplete="nickname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={64} required data-testid="profile-display-name" /></label>
        <label>用户名<input name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" /><small>可留空。3–24 位英文字母、数字或下划线，用户名必须唯一。</small></label>
        <div className="account-actions"><button className="button button-primary button-default" disabled={profileBusy} type="submit">{profileBusy ? "正在保存…" : "保存个人资料"}</button></div>
      </form><AccountNotice {...profileNotice} />
      <p className="account-mini-copy">当前资料版本 {snapshot?.profile.version}。本页面包含尚待同步的本地修改；是否已保存到云端请查看同步状态。</p>
    </section>
    <section className="account-panel"><span className="eyebrow"><SlidersHorizontal size={14} />PERSONAL PREFERENCES</span><h2>适合你的使用习惯</h2><p className="account-description">主题、语言偏好、计量单位和时区随账号保存。语言与通知偏好将供后续业务模块使用。</p>
      <form className="account-form" onSubmit={savePreferences}>
        <label>主题<select name="theme" value={theme} onChange={(e) => changeTheme(e.target.value as "dark" | "light")}><option value="dark">深色模式</option><option value="light">浅色模式</option></select></label>
        <label>语言偏好<select name="language" value={language} onChange={(e) => setLanguage(e.target.value as "zh-CN" | "en")}><option value="zh-CN">简体中文</option><option value="en">English</option></select></label>
        <label>计量单位<select name="unit_system" value={units} onChange={(e) => setUnits(e.target.value as "metric" | "imperial")}><option value="metric">公制（kg / km）</option><option value="imperial">英制（lb / mi）</option></select></label>
        <label>时区<input name="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} required maxLength={80} list="account-timezones" /><datalist id="account-timezones"><option value="Asia/Shanghai" /><option value="Asia/Hong_Kong" /><option value="UTC" /><option value="Europe/London" /><option value="America/New_York" /></datalist><small>使用 IANA 时区名称，例如 Asia/Shanghai。</small></label>
        <label className="account-check"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />接收账号相关邮件通知的偏好</label>
        <label className="account-check"><input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />保存推送通知偏好（尚未启用消息推送）</label>
        <div className="account-actions"><button className="button button-primary button-default" disabled={preferencesBusy} type="submit">{preferencesBusy ? "正在保存…" : "保存个人偏好"}</button></div>
      </form><AccountNotice {...preferencesNotice} />
    </section>
  </div>;
}
