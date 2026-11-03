"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import type { AccountSnapshot, Entity } from "@/lib/account/types";
import { SyncEngine, type SyncView } from "./engine";
import type { QueueItem } from "./model";
import { clearPrivateStore, updateState } from "./indexed-store";

type SyncContextValue = {
  snapshot:AccountSnapshot|null;pending:QueueItem[];loading:boolean;online:boolean;syncing:boolean;error:string|null;lastSyncedAt:string|null;
  enqueue:(entity:Entity,patch:Record<string,unknown>)=>Promise<void>;
  retry:()=>Promise<void>;resolveConflict:(id:string,choice:"cloud"|"local")=>Promise<void>;
  discardMutation:(id:string)=>Promise<void>;
  logout:(options?:{discardPending?:boolean})=>Promise<void>;exportPending:()=>void;
};
const SyncContext=createContext<SyncContextValue|null>(null);
const blankView:SyncView={snapshot:null,projected:null,queue:[],lastSyncedAt:null,loading:true,online:true,syncing:false,error:null};
export function SyncProvider({children}:{children:ReactNode}){
  const {user,client,refreshUser}=useAuth();
  const userId=user?.id;
  const engineRef=useRef<SyncEngine|null>(null);
  const [cleanupIssue,setCleanupIssue]=useState<{userId:string;message:string}|null>(null);
  const [state,setState]=useState<{userId:string|null;view:SyncView}>({userId:null,view:blankView});
  useEffect(()=>{
    if(!userId)return;
    let active=true;
    const engine=new SyncEngine(userId,view=>{if(active)setState({userId,view});},()=>{void refreshUser();});
    engineRef.current=engine;void engine.start();
    return ()=>{active=false;engine.dispose();if(engineRef.current===engine)engineRef.current=null;};
  },[userId,refreshUser]); // Only account identity changes create a new private store.
  useEffect(()=>{
    const changed=(event:Event)=>{
      const detail=(event as CustomEvent<{previousUserId:string;nextUserId:string|null;reason:string}>).detail;
      if(!detail?.previousUserId)return;
      const previous=detail.previousUserId;
      const engine=engineRef.current;
      if(engine?.userId===previous){engine.dispose();engineRef.current=null;}
      if(detail.reason==="expired"){
        // Keep only the durable user-scoped operations, never a usable account snapshot after expiry.
        void updateState(previous,s=>({...s,snapshot:null,queue:s.queue.map(q=>({...q,conflict:undefined,status:"pending",nextAttemptAt:0}))})).catch(()=>setCleanupIssue({userId:previous,message:"过期会话的本地快照清理未完成。请关闭其他本站页面后重试清理；重试会清除该账号在此设备的待同步操作。"}));
      }else{
        void clearPrivateStore(previous).catch(()=>setCleanupIssue({userId:previous,message:"退出或切换账号后的本地缓存清理未完成。请关闭其他本站页面后重试清理。"}));
      }
    };
    window.addEventListener("fitness-os-auth-change",changed);
    return()=>window.removeEventListener("fitness-os-auth-change",changed);
  },[]);
  const requireEngine=useCallback(()=>{const engine=engineRef.current;if(!engine || engine.userId!==userId)throw new Error("请先登录并等待账户加载。");return engine;},[userId]);
  const enqueue=useCallback(async(entity:Entity,patch:Record<string,unknown>)=>{await requireEngine().enqueue(entity,patch);},[requireEngine]);
  const retry=useCallback(async()=>{await requireEngine().retry();},[requireEngine]);
  const resolveConflict=useCallback(async(id:string,choice:"cloud"|"local")=>{await requireEngine().resolveConflict(id,choice);},[requireEngine]);
  const discardMutation=useCallback(async(id:string)=>{await requireEngine().discard(id);},[requireEngine]);
  const exportPending=useCallback(()=>{requireEngine().exportPending();},[requireEngine]);
  const logout=useCallback(async(options?:{discardPending?:boolean})=>{
    const engine=engineRef.current;
    if(engine?.getPending().length && !options?.discardPending)throw new Error("仍有待同步修改。请先同步或导出，再确认丢弃这些本地修改后退出。");
    if(!client)throw new Error("Supabase 尚未配置。");
    const result=await client.auth.signOut();
    if(result.error)throw new Error("退出请求未完成，请检查网络后重试。本地队列尚未清除。");
    if(engine){try{await engine.purge();}catch{setCleanupIssue({userId:engine.userId,message:"已退出账号，但本地私人缓存仍被其他页面占用。请关闭其他本站页面后重试清理。"});throw new Error("已退出账号；请按页面提示完成本地缓存清理。");}}
    await refreshUser();
  },[client,refreshUser]);
  const view=state.userId===user?.id?state.view:blankView;
  const value=useMemo<SyncContextValue>(()=>({snapshot:user?view.projected:null,pending:user?view.queue:[],loading:Boolean(user)&&view.loading,online:view.online,syncing:Boolean(user)&&view.syncing,error:user?view.error:null,lastSyncedAt:user?view.lastSyncedAt:null,enqueue,retry,resolveConflict,discardMutation,logout,exportPending}),[user,view,enqueue,retry,resolveConflict,discardMutation,logout,exportPending]);
  return <SyncContext.Provider value={value}>{cleanupIssue && <div role="alert" style={{position:"fixed",bottom:90,left:16,right:16,zIndex:1000,padding:16,background:"var(--surface, #17212b)",color:"var(--text, #fff)",border:"1px solid #f59e0b",borderRadius:12}}><p>{cleanupIssue.message}</p><button type="button" onClick={()=>{if(window.confirm("重试会清除该账号在本设备的全部私人快照及待同步操作，是否继续？"))void clearPrivateStore(cleanupIssue.userId).then(()=>setCleanupIssue(null)).catch(()=>setCleanupIssue({...cleanupIssue,message:"缓存仍被占用，请关闭其他本站页面后再次重试。"}));}}>重试清理</button></div>}{children}</SyncContext.Provider>;
}
export function useSync(){const value=useContext(SyncContext);if(!value)throw new Error("useSync must be used inside SyncProvider");return value;}
