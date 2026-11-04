import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AccountSnapshot } from "../../src/lib/account/types";

const enabled=process.env.PHASE2_AUTH_INTEGRATION==="1";
if(enabled && existsSync(".env.local"))process.loadEnvFile(".env.local");
function localAdmin():SupabaseClient {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key || !["127.0.0.1","localhost","[::1]"].includes(new URL(url).hostname))throw new Error("Sync integration requires a real local Supabase project; it never creates test users on hosted projects.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function login(page:Page,email:string,password:string){
  await page.goto("/auth/sign-in");
  await page.getByLabel("邮箱地址",{exact:true}).fill(email);
  await page.getByLabel("密码",{exact:true}).fill(password);
  await expect(page.getByRole("button",{name:"登录账户",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"登录账户",exact:true}).click();
  await expect(page).toHaveURL(/\/account\/profile$/);
  await expect(page.getByTestId("profile-display-name")).toBeVisible();
}
async function snapshot(context:BrowserContext):Promise<AccountSnapshot>{
  const response=await context.request.get("http://127.0.0.1:3000/api/account/snapshot");
  expect(response.ok()).toBe(true);return response.json();
}
async function saveName(page:Page,name:string){
  await page.getByTestId("profile-display-name").fill(name);
  await page.getByRole("button",{name:"保存个人资料",exact:true}).click();
}
async function queue(page:Page,userId:string){
  return page.evaluate(async(uid)=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("fitness-os-private-"+uid);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error("Cannot read real browser IndexedDB"));});
    try{return await new Promise<Array<{mutation:{mutationId:string,baseVersion:number,patch:Record<string,unknown>},status:string}>>((resolve,reject)=>{const r=db.transaction("state","readonly").objectStore("state").get("current");r.onsuccess=()=>resolve(r.result?.queue ?? []);r.onerror=()=>reject(new Error("Cannot read real outbox"));});}finally{db.close();}
  },userId);
}
async function waitName(context:BrowserContext,name:string){await expect.poll(async()=>(await snapshot(context)).profile.display_name,{timeout:25_000}).toBe(name);}

test("real desktop/mobile sync, durable offline edits, explicit conflicts, idempotent lost-ack retry and logout isolation",async({browser})=>{
  test.skip(!enabled,"Requires PHASE2_AUTH_INTEGRATION=1 and actual local Supabase; no mocked sync acceptance.");
  test.setTimeout(180_000);
  const admin=localAdmin();const userIds:string[]=[];
  const password=`Sync-Only!${randomUUID()}`;const email=`sync-${randomUUID()}@fitness.local`;
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:"Initial Athlete"}});
  if(created.error || !created.data.user)throw new Error("Unable to create the local sync test user.");
  const userId=created.data.user.id;userIds.push(userId);
  const desktop=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:"allow"});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:"allow"});
  const a=await desktop.newPage(),b=await mobile.newPage();const errors:string[]=[];
  a.on("pageerror",e=>errors.push(e.message));b.on("pageerror",e=>errors.push(e.message));
  try{
    await login(a,email,password);await login(b,email,password);
    await saveName(a,"Saved on desktop");await waitName(desktop,"Saved on desktop");
    await expect(b.getByTestId("profile-display-name")).toHaveValue("Saved on desktop",{timeout:20_000});
    await b.getByRole("combobox",{name:"主题",exact:true}).selectOption("light");
    await b.getByRole("combobox",{name:"计量单位",exact:true}).selectOption("imperial");
    await b.getByRole("button",{name:"保存个人偏好",exact:true}).click();
    await expect.poll(async()=>(await snapshot(mobile)).preferences.theme).toBe("light");
    await expect(a.getByRole("combobox",{name:"计量单位",exact:true})).toHaveValue("imperial",{timeout:20_000});

    await desktop.setOffline(true);await expect.poll(()=>a.evaluate(()=>navigator.onLine)).toBe(false);
    await saveName(a,"Offline edit kept in IndexedDB");
    await expect.poll(async()=>(await queue(a,userId)).length).toBe(1);
    const offlineItem=(await queue(a,userId))[0];
    expect(offlineItem.mutation.patch.display_name).toBe("Offline edit kept in IndexedDB");
    // A separate browser session writes to the actual DB while desktop is offline.
    await saveName(b,"Changed on phone during desktop offline");await waitName(mobile,"Changed on phone during desktop offline");
    await desktop.setOffline(false);await a.goto("/account/sync");
    await expect(a.getByText("需要处理冲突",{exact:true})).toBeVisible({timeout:25_000});
    expect((await queue(a,userId))[0].mutation.mutationId).toBe(offlineItem.mutation.mutationId);
    await a.getByRole("button",{name:"使用云端版本",exact:true}).click();
    await expect.poll(async()=>(await queue(a,userId)).length).toBe(0);
    await a.goto("/account/profile");await expect(a.getByTestId("profile-display-name")).toHaveValue("Changed on phone during desktop offline");

    await desktop.setOffline(true);await saveName(a,"Local choice after conflict");
    await expect.poll(async()=>(await queue(a,userId)).length).toBe(1);
    await saveName(b,"Second phone change");await waitName(mobile,"Second phone change");
    await desktop.setOffline(false);await a.goto("/account/sync");
    await expect(a.getByText("需要处理冲突",{exact:true})).toBeVisible({timeout:25_000});
    await a.getByRole("button",{name:"保留本地修改并重试",exact:true}).click();
    await waitName(desktop,"Local choice after conflict");await expect.poll(async()=>(await queue(a,userId)).length).toBe(0);
    await expect(b.getByTestId("profile-display-name")).toHaveValue("Local choice after conflict",{timeout:20_000});

    await a.goto("/account/profile");
    const before=(await snapshot(desktop)).profile.version;
    let allowAck=false,committed=false;const sentIds:string[]=[];
    await a.route("**/api/account/mutations",async(route)=>{
      const body=route.request().postDataJSON() as {mutationId:string};sentIds.push(body.mutationId);
      if(!committed){const response=await route.fetch();expect(response.status()).toBe(200);committed=true;await route.abort("failed");}
      else if(!allowAck)await route.abort("failed");
      else await route.continue();
    });
    await saveName(a,"Server committed but response lost");
    await waitName(mobile,"Server committed but response lost");
    await expect.poll(async()=>(await queue(a,userId)).length).toBe(1);
    const retained=(await queue(a,userId))[0];expect(retained.mutation.mutationId).toBe(sentIds[0]);
    allowAck=true;await a.goto("/account/sync");
    await a.getByRole("button",{name:"立即同步 / 重试",exact:true}).click();
    await expect.poll(async()=>(await queue(a,userId)).length,{timeout:25_000}).toBe(0);
    expect(new Set(sentIds).size).toBe(1);expect(sentIds.length).toBeGreaterThanOrEqual(2);
    expect((await snapshot(desktop)).profile.version).toBe(before+1);
    await a.unroute("**/api/account/mutations");

    // Explicit logout purges the private database; the next account sees only its own records.
    await a.goto("/account/security");await a.getByRole("button",{name:"退出登录",exact:true}).click();
    await expect(a).toHaveURL(/\/auth\/sign-in$/);
    await expect.poll(()=>a.evaluate(async()=> (await indexedDB.databases()).map(db=>db.name))).not.toContain("fitness-os-private-"+userId);
    const otherEmail=`sync-other-${randomUUID()}@fitness.local`;
    const other=await admin.auth.admin.createUser({email:otherEmail,password,email_confirm:true,user_metadata:{display_name:"Second Account Only"}});
    if(other.error || !other.data.user)throw new Error("Unable to create the second local sync test user.");
    userIds.push(other.data.user.id);
    await login(a,otherEmail,password);
    await expect(a.getByTestId("profile-display-name")).toHaveValue("Second Account Only");
    expect((await snapshot(desktop)).profile.id).toBe(other.data.user.id);
    expect(errors).toEqual([]);
  }finally{
    await desktop.close();await mobile.close();
    for(const id of userIds)await admin.auth.admin.deleteUser(id);
  }
});
