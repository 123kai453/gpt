import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type TestRequest = {
  url: string;
  method: string;
  mode: string;
  destination: string;
};

type PublicResponse = {
  path: string;
  ok: boolean;
  type: string;
  headers: { get: (name: string) => string };
  clone: () => PublicResponse;
};

const ORIGIN = "https://fitness.example";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const currentCache = `fitness-os-public-${/const VERSION = "([^"]+)"/.exec(source)![1]}`;

function createWorker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const stores = new Map<string, PublicResponse>();
  const savedPaths: string[] = [];
  const deleted: string[] = [];
  const options = { failNetwork: false, cacheControl: "public, max-age=31536000, immutable" };
  const skipWaiting = vi.fn();
  const claim = vi.fn(async () => undefined);
  const key = (request: TestRequest | string) => typeof request === "string" ? request : request.url;
  const response = (path: string): PublicResponse => {
    const result: PublicResponse = {
      path,
      ok: true,
      type: "basic",
      headers: { get: () => options.cacheControl },
      clone: () => result,
    };
    return result;
  };
  const cache = {
    async addAll(paths: string[]) {
      paths.forEach((path) => stores.set(path, response(path)));
    },
    async match(request: TestRequest | string) { return stores.get(key(request)); },
    async put(request: TestRequest | string, value: PublicResponse) {
      savedPaths.push(key(request));
      stores.set(key(request), value);
    },
  };
  const fetch = vi.fn(async (request: TestRequest) => {
    if (options.failNetwork) throw new Error("offline");
    return response(request.url);
  });
  runInNewContext(source, {
    URL,
    Response,
    self: {
      location: { origin: ORIGIN },
      clients: { claim },
      skipWaiting,
      addEventListener(name: string, callback: (event: unknown) => void) {
        listeners.set(name, callback);
      },
    },
    caches: {
      async open() { return cache; },
      async keys() { return ["another-app-cache", "fitness-os-public-old", currentCache]; },
      async delete(name: string) { deleted.push(name); },
    },
    fetch,
  });

  function request(path: string, overrides: Partial<TestRequest> = {}): TestRequest {
    return { url: new URL(path, ORIGIN).href, method: "GET", mode: "cors", destination: "", ...overrides };
  }
  async function lifecycle(name: "install" | "activate") {
    let pending: Promise<unknown> | undefined;
    listeners.get(name)?.({ waitUntil(task: Promise<unknown>) { pending = task; } });
    await pending;
  }
  async function dispatchFetch(value: TestRequest) {
    let pending: Promise<unknown> | undefined;
    listeners.get("fetch")?.({
      request: value,
      respondWith(task: Promise<unknown>) { pending = task; },
    });
    return pending ? await pending : undefined;
  }
  function message(type: string) { listeners.get("message")?.({ data: { type } }); }
  return { lifecycle, dispatchFetch, request, message, stores, savedPaths, deleted, options, skipWaiting, claim, fetch };
}

describe("public PWA service worker safeguards", () => {
  it("precaches only the explicit generic shell and original icons without activating updates", async () => {
    const worker = createWorker();
    await worker.lifecycle("install");
    expect([...worker.stores.keys()]).toEqual([
      "/offline.html", "/manifest.json", "/icons/mark.svg", "/icons/icon-192.png",
      "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png",
    ]);
    expect(worker.stores.has("/")).toBe(false);
    expect(worker.skipWaiting).not.toHaveBeenCalled();
  });

  it("does not intercept API, authentication, private or storage requests", async () => {
    const worker = createWorker();
    for (const path of ["/api/health", "/auth/session", "/account", "/private/file.png", "/storage/token", "/supabase/session"]) {
      expect(await worker.dispatchFetch(worker.request(path, { mode: "navigate" }))).toBeUndefined();
    }
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(worker.savedPaths).toEqual([]);
  });

  it("bypasses POST, cross-origin and arbitrary media requests", async () => {
    const worker = createWorker();
    expect(await worker.dispatchFetch(worker.request("/notes", { method: "POST" }))).toBeUndefined();
    expect(await worker.dispatchFetch(worker.request("https://other.example/tracker.js", { destination: "script" }))).toBeUndefined();
    expect(await worker.dispatchFetch(worker.request("/photos/user-photo.png", { destination: "image" }))).toBeUndefined();
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it("never saves navigation responses even when the network succeeds", async () => {
    const worker = createWorker();
    await worker.dispatchFetch(worker.request("/", { mode: "navigate" }));
    await worker.dispatchFetch(worker.request("/data", { mode: "navigate" }));
    expect(worker.fetch).toHaveBeenCalledTimes(2);
    expect(worker.savedPaths).toEqual([]);
  });

  it("returns the generic shell for offline navigation without retaining private page responses", async () => {
    const worker = createWorker();
    await worker.lifecycle("install");
    worker.options.failNetwork = true;
    await expect(worker.dispatchFetch(worker.request("/sports", { mode: "navigate" })))
      .resolves.toMatchObject({ path: "/offline.html" });
    expect(worker.savedPaths).toEqual([]);
  });

  it("caches only permitted Next immutable asset requests and honors private response directives", async () => {
    const worker = createWorker();
    const asset = worker.request("/_next/static/chunks/app.js", { destination: "script" });
    await worker.dispatchFetch(asset);
    await worker.dispatchFetch(asset);
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    expect(worker.savedPaths).toEqual([asset.url]);
    worker.options.cacheControl = "private, no-store";
    await worker.dispatchFetch(worker.request("/_next/static/chunks/private.js", { destination: "script" }));
    expect(worker.savedPaths).toEqual([asset.url]);
  });

  it("does not persist token-bearing queries or unapproved asset types", async () => {
    const worker = createWorker();
    await worker.dispatchFetch(worker.request("/_next/static/chunks/app.js?token=sensitive", { destination: "script" }));
    expect(worker.savedPaths).toEqual([]);
    expect(await worker.dispatchFetch(worker.request("/_next/static/data.json"))).toBeUndefined();
  });

  it("activates an update only after the explicit message and cleans up only its own caches", async () => {
    const worker = createWorker();
    worker.message("OTHER");
    expect(worker.skipWaiting).not.toHaveBeenCalled();
    worker.message("SKIP_WAITING");
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1);
    await worker.lifecycle("activate");
    expect(worker.deleted).toEqual(["fitness-os-public-old"]);
    expect(worker.claim).toHaveBeenCalledTimes(1);
  });
});
