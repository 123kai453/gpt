"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { useSync } from "@/features/sync/sync-provider";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WorkerStatus = "checking" | "ready" | "development" | "unsupported" | "error";

function subscribeEnvironment() { return () => {}; }
function readEnvironment(): WorkerStatus | "supported" {
  if (process.env.NODE_ENV !== "production") return "development";
  return "serviceWorker" in navigator && window.isSecureContext ? "supported" : "unsupported";
}
function serverEnvironment(): WorkerStatus | "supported" { return "checking"; }

export function PwaControls() {
  const { user } = useAuth();
  const sync = useSync();
  const environment = useSyncExternalStore(subscribeEnvironment, readEnvironment, serverEnvironment);
  const [online, setOnline] = useState(true);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installMessage, setInstallMessage] = useState("");
  const [status, setStatus] = useState<WorkerStatus>("checking");
  const [hasUpdate, setHasUpdate] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const updateRequested = useRef(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const standalone = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(standalone.matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const detectDevice = () => {
      setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
      updateOnline();
      updateInstalled();
    };
    detectDevice();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    standalone.addEventListener("change", updateInstalled);

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const appInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setInstallMessage("应用已安装，可从主屏幕打开。");
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      standalone.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanupRegistration: (() => void) | undefined;
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    const controllerChange = () => {
      if (updateRequested.current) {
        updateRequested.current = false;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChange);
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (disposed) return;
        registration.current = reg;
        if (reg.waiting && navigator.serviceWorker.controller) setHasUpdate(true);
        const workers: Array<{ worker: ServiceWorker; handler: () => void }> = [];
        const updateFound = () => {
          const worker = reg.installing;
          if (!worker) return;
          const handler = () => {
            if (disposed) return;
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          };
          worker.addEventListener("statechange", handler);
          workers.push({ worker, handler });
        };
        reg.addEventListener("updatefound", updateFound);
        if (reg.installing) updateFound();
        const checkUpdate = () => {
          if (document.visibilityState === "visible" && navigator.onLine) {
            void reg.update().catch(() => { /* Offline/temporary checks retry later. */ });
          }
        };
        document.addEventListener("visibilitychange", checkUpdate);
        cleanupRegistration = () => {
          reg.removeEventListener("updatefound", updateFound);
          document.removeEventListener("visibilitychange", checkUpdate);
          workers.forEach(({ worker, handler }) => worker.removeEventListener("statechange", handler));
        };
        void navigator.serviceWorker.ready.then(() => {
          if (!disposed) setStatus("ready");
        });
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      cleanupRegistration?.();
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChange);
    };
  }, []);

  async function requestInstall() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      setInstallMessage(choice.outcome === "accepted"
        ? "已交由浏览器处理，请完成安装。"
        : "已取消安装，你仍可继续使用网页版。");
    } catch {
      setInstallMessage("暂时无法唤起安装，请使用浏览器菜单中的安装选项。");
    }
  }

  function applyUpdate() {
    const worker = registration.current?.waiting;
    if (!worker) {
      setHasUpdate(false);
      return;
    }
    updateRequested.current = true;
    worker.postMessage({ type: "SKIP_WAITING" });
  }

  const statusText: Record<WorkerStatus, string> = {
    checking: "正在检查离线外壳…",
    ready: "离线应用外壳已就绪",
    development: "开发模式未启用离线缓存",
    unsupported: "当前环境未提供 Service Worker 支持",
    error: "离线外壳准备失败，联网浏览不受影响",
  };

  return (
    <>
      {!online && (
        <div className="pwa-offline" role="status">
          <WifiOff size={15} aria-hidden="true" />
          <span>{user ? `当前离线 · 账户待同步 ${sync.pending.length} 项，请保留此页面` : "当前离线 · 业务记录与云同步尚未启用"}</span>
        </div>
      )}
      <div className={`pwa-position${online ? "" : " is-offline"}`}>
        {hasUpdate && (
          <div className="pwa-update" role="status">
            <span>发现新版本</span>
            <button type="button" onClick={applyUpdate}>
              <RefreshCw size={14} aria-hidden="true" /> 更新并刷新
            </button>
          </div>
        )}
        {open && (
          <section className="pwa-panel" aria-labelledby="pwa-title" id="pwa-install-help">
            <div className="pwa-panel-heading">
              <h2 id="pwa-title">把 FITNESS OS 放在手边</h2>
              <button type="button" aria-label="关闭安装说明" onClick={() => setOpen(false)}><X size={17} /></button>
            </div>
            <p>{installed ? "已在独立应用模式中，或浏览器已确认安装。" :
              ios ? "在 Safari 中打开分享菜单，选择「添加到主屏幕」。安装由系统完成。" :
                installEvent ? "安装后，可从桌面或主屏幕直接打开。" :
                  "若浏览器支持，请在地址栏或浏览器菜单中选择「安装应用」。当前浏览器尚未提供自动安装提示。"}</p>
            {installEvent && !installed && (
              <button className="pwa-primary" type="button" onClick={() => void requestInstall()}>
                <Download size={15} aria-hidden="true" /> 继续安装
              </button>
            )}
            {installMessage && <p role="status">{installMessage}</p>}
            <p className="pwa-small" role="status">{statusText[environment === "supported" ? status : environment]}</p>
            <p className="pwa-small">当前仅缓存公开静态资源与离线外壳，不缓存私人健康数据或需要鉴权的 API。</p>
          </section>
        )}
        <button className="pwa-trigger" type="button" onClick={() => setOpen(!open)}
          aria-label={installed ? "应用信息" : "安装应用"} aria-expanded={open} aria-controls="pwa-install-help" title="安装应用与离线信息">
          <Download size={14} aria-hidden="true" /> {installed ? "应用信息" : "安装应用"}
        </button>
      </div>
      <style jsx>{`
        :global(body:has(.pwa-offline) .app-shell){padding-top:38px}
        :global(body:has(.pwa-offline) .sidebar){top:38px}
        .pwa-position{position:fixed;right:24px;bottom:18px;z-index:45;display:flex;align-items:flex-end;flex-direction:column;gap:10px;font-size:12px}
        .pwa-trigger,.pwa-panel,.pwa-update{color:var(--foreground,#f4f6ee);background:var(--card,#1c211a);border:1px solid var(--border,#343c2d);box-shadow:0 8px 30px #0002}
        button{font:inherit;cursor:pointer;touch-action:manipulation}
        button:focus-visible{outline:2px solid #a8c85b;outline-offset:4px}
        .pwa-trigger{display:flex;align-items:center;gap:7px;padding:10px 13px;border-radius:999px;min-height:40px}
        .pwa-panel{width:min(340px,calc(100vw - 32px));padding:20px;border-radius:18px;line-height:1.7}
        .pwa-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .pwa-panel-heading h2{font-size:14px;font-weight:650;margin:0}
        .pwa-panel-heading button{border:0;background:transparent;color:inherit;display:grid;place-items:center;min-width:32px;min-height:32px}
        .pwa-panel p{margin:12px 0 0}
        .pwa-small{opacity:.67;font-size:11px}
        .pwa-primary,.pwa-update button{display:inline-flex;align-items:center;gap:6px;border:0;background:#d6fb78;color:#18210a;font-weight:650;padding:10px 14px;border-radius:10px;margin-top:14px}
        .pwa-update{display:flex;align-items:center;gap:16px;padding:10px 12px;border-radius:14px}
        .pwa-update button{margin:0;padding:8px 10px}
        .pwa-offline{position:fixed;top:0;left:0;right:0;z-index:80;display:flex;align-items:center;justify-content:center;gap:8px;background:#f2d78c;color:#352a0f;padding:6px 12px;font-size:11px;min-height:38px;text-align:center}
        @media(max-width:767px){.pwa-position{right:68px;top:10px;bottom:auto;gap:8px}.pwa-position.is-offline{top:48px}.pwa-trigger{padding:0;width:44px;height:44px;min-height:44px;font-size:0;gap:0;justify-content:center;border:0;background:transparent;box-shadow:none}.pwa-trigger svg{width:17px;height:17px}.pwa-panel{position:absolute;top:48px;right:-42px;max-height:65svh;overflow:auto}.pwa-update{position:absolute;top:48px;right:-42px;width:285px}.pwa-update+.pwa-panel{top:116px}}
      `}</style>
    </>
  );
}
