import type { AccountSnapshot, Entity, MutationResult } from "@/lib/account/types";
import { preferencesPatchSchema, profilePatchSchema } from "@/lib/account/validation";
import { appendMutation, applyResult, emptyState, nextMutation, projectSnapshot, resolveItem, retryDelay, type LocalState } from "./model";
import { clearPrivateStore, closePrivateStore, readState, updateState, withSyncLock } from "./indexed-store";

export type SyncView = LocalState & { online:boolean; syncing:boolean; loading:boolean; error:string|null; projected:AccountSnapshot|null };
export class SyncEngine {
  private local=emptyState();private stopped=false;private busy=false;private abort=new AbortController();
  private timer:ReturnType<typeof setInterval>|undefined;private channel:BroadcastChannel|null=null;
  private loading=true;private error:string|null=null;private paused=false;private deviceId:string;
  private online=typeof navigator==="undefined"?true:navigator.onLine;
  constructor(readonly userId:string,private onChange:(view:SyncView)=>void,private onUnauthorized:()=>void) {
    const key="fitness-os-device-"+userId;
    try{this.deviceId=localStorage.getItem(key) || crypto.randomUUID();localStorage.setItem(key,this.deviceId);}catch{this.deviceId=crypto.randomUUID();}
  }
  private emit(){if(!this.stopped)this.onChange({...this.local,online:this.online,syncing:this.busy,loading:this.loading,error:this.error,projected:projectSnapshot(this.local)});}
  private async save(transform:(s:LocalState)=>LocalState){
    if(this.stopped)return;
    this.local=await updateState(this.userId,transform);this.emit();this.channel?.postMessage({type:"changed"});
  }
  private async reload(){if(this.stopped)return;this.local=await readState(this.userId);this.emit();}
  async start(){
    try{
      await this.reload();if(this.stopped)return;this.loading=false;this.emit();
      if(typeof BroadcastChannel!=="undefined"){
        this.channel=new BroadcastChannel("fitness-os-sync-"+this.userId);
        this.channel.onmessage=(event)=>{
          if(event.data?.type==="purge"){closePrivateStore(this.userId);this.local=emptyState();this.error="账户已在另一个页面退出，请重新登录。";this.emit();this.dispose();this.onUnauthorized();}
          else if(event.data?.type==="changed")void this.reload().catch(()=>{});
        };
      }
      window.addEventListener("online",this.handleOnline);window.addEventListener("offline",this.handleOffline);window.addEventListener("focus",this.handleFocus);
      this.timer=setInterval(()=>{void this.tick();},5_000);await this.tick();
    }catch{this.loading=false;this.error="无法打开账户本地存储。请允许本站使用 IndexedDB 后重试，尚未保存任何修改。";this.emit();}
  }
  private handleOnline=()=>{this.online=true;this.paused=false;this.error=null;this.emit();void this.tick();};
  private handleOffline=()=>{this.online=false;this.emit();};
  private handleFocus=()=>{void this.tick();};
  private async fetch(path:string,options:RequestInit={}):Promise<Response>{
    const timeout=AbortSignal.timeout(20_000);
    return fetch(path,{...options,cache:"no-store",credentials:"same-origin",signal:AbortSignal.any([this.abort.signal,timeout])});
  }
  private async pull(){
    const response=await this.fetch("/api/account/snapshot");
    if(response.status===401){this.unauthorized();return;}
    if(!response.ok)throw new Error("暂时无法读取云端资料，待同步操作仍保存在此设备。");
    const data=await response.json() as AccountSnapshot;
    if(data.profile?.id!==this.userId || data.preferences?.user_id!==this.userId || typeof data.profile.version!=="number" || typeof data.preferences.version!=="number")throw new Error("云端返回的账户归属无效，已停止读取。");
    await this.save(s=>({...s,snapshot:data,lastSyncedAt:new Date().toISOString()}));
  }
  private unauthorized(){this.paused=true;this.error="登录会话已过期，请重新登录。待同步操作仍保存在此账号的本地队列。";this.emit();this.onUnauthorized();}
  async tick(){
    if(this.stopped || this.busy || this.paused || !this.online)return;
    this.busy=true;this.emit();
    try{
      await withSyncLock(this.userId,async()=>{
        await this.reload();
        // Upload stable queued mutations before pulling, preserving their original base versions.
        for(let i=0;i<200 && !this.stopped && this.online && !this.paused;i++){
          const item=nextMutation(this.local,Date.now());if(!item)break;
          const id=item.mutation.mutationId;
          await this.save(s=>({...s,queue:s.queue.map(q=>q.mutation.mutationId===id?{...q,attempts:q.attempts+1}:q)}));
          try{
            const response=await this.fetch("/api/account/mutations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item.mutation)});
            if(response.status===401){this.unauthorized();break;}
            const data=await response.json();
            if((response.ok || response.status===409) && (data.status==="applied" || data.status==="conflict") && data.entity===item.mutation.entity && data.mutation_id===id){
              await this.save(s=>applyResult(s,id,data as MutationResult));this.error=null;
            }else{
              const message=typeof data.error?.message==="string" ? data.error.message : "同步请求被拒绝，请检查账户状态后重试。";
              const retryable=response.status===429 || response.status>=500;
              const header=response.headers.get("retry-after");
              const retryAt=header && Number.isFinite(Number(header))?Date.now()+Math.min(86_400,Math.max(1,Number(header)))*1000:Date.now()+retryDelay(item.attempts+1);
              await this.save(s=>({...s,queue:s.queue.map(q=>q.mutation.mutationId===id?{...q,status:retryable?"pending":"failed",error:message,nextAttemptAt:retryAt}:q)}));
              this.error=message;if(retryable)break;
            }
          }catch{
            if(this.stopped)break;
            const message="网络请求未完成，系统将使用同一个幂等键重试；本地修改已保留。";
            await this.save(s=>({...s,queue:s.queue.map(q=>q.mutation.mutationId===id?{...q,error:message,nextAttemptAt:Date.now()+retryDelay(item.attempts+1)}:q)}));
            this.error=message;break;
          }
        }
        if(!this.paused && !this.stopped)await this.pull();
      });
    }catch(error){if(!this.stopped)this.error=error instanceof Error?error.message:"同步失败，本地修改已保留。";}
    finally{this.busy=false;this.emit();}
  }
  async enqueue(entity:Entity,patch:Record<string,unknown>){
    const parsed=entity==="profile"?profilePatchSchema.parse(patch):preferencesPatchSchema.parse(patch);
    await this.save(state=>appendMutation(state,{entity,patch:parsed,deviceId:this.deviceId,mutationId:crypto.randomUUID()}));
    void this.tick();
  }
  async retry(){this.paused=false;this.error=null;await this.save(s=>({...s,queue:s.queue.map(q=>q.status==="conflict"?q:{...q,status:"pending",nextAttemptAt:0,error:undefined})}));await this.tick();}
  async resolveConflict(id:string,choice:"cloud"|"local"){await this.save(s=>resolveItem(s,id,choice,()=>crypto.randomUUID()));await this.tick();}
  async discard(id:string){await this.save(s=>({...s,queue:s.queue.filter(q=>q.mutation.mutationId!==id)}));await this.tick();}
  getPending(){return this.local.queue;}
  exportPending(){
    const blob=new Blob([JSON.stringify({schema:"fitness-os-pending-v1",user_id:this.userId,exported_at:new Date().toISOString(),operations:this.local.queue},null,2)],{type:"application/json"});
    const href=URL.createObjectURL(blob);const a=document.createElement("a");a.href=href;a.download="fitness-os-pending.json";a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  async purge(){this.channel?.postMessage({type:"purge"});this.dispose();await clearPrivateStore(this.userId);}
  dispose(){this.stopped=true;this.abort.abort();if(this.timer)clearInterval(this.timer);window.removeEventListener("online",this.handleOnline);window.removeEventListener("offline",this.handleOffline);window.removeEventListener("focus",this.handleFocus);this.channel?.close();this.channel=null;closePrivateStore(this.userId);}
}
