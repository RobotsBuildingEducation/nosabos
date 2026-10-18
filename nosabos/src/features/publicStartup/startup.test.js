import test from "node:test";
import assert from "node:assert/strict";
import { createDeferredService } from "./deferredService.js";
import { createPublicIdentityActions } from "./identityActions.js";
import { afterPublicPaint } from "./afterPublicPaint.js";

const storage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
};
const immediateService = (value) => ({ ready: async () => value, call: async (name, ...args) => value[name](...args) });

test("background startup and an early click share one mounted service, using its latest methods", async () => {
  let publish, requests = 0;
  const service = createDeferredService((ready) => { publish = ready; requests++; });
  const warmup = service.ready();
  const click = service.call("action", "hello");
  assert.equal(service.ready(), warmup);
  await Promise.resolve();
  assert.equal(requests, 1);
  publish({ action: (value) => value.toUpperCase() });
  await warmup;
  assert.equal(await click, "HELLO");
  publish({ action: () => "new account" });
  assert.equal(await service.call("action"), "new account");
});

test("a failed backend import rejects waiting actions and can be retried", async () => {
  let attempts = 0;
  const service = createDeferredService((publish) => {
    if (++attempts === 1) throw new Error("offline");
    publish({ action: () => 42 });
  });
  await assert.rejects(service.call("action"), /offline/);
  assert.equal(await service.call("action"), 42);
  assert.equal(attempts, 2);
});

test("public backend work follows actual content paint, even before progress metadata is ready; cleanup cancels it", () => {
  let ready = false, loader = true, calls = 0, id = 0;
  const frames = new Map();
  const browser = {
    __piyaliStartupResources: { getSnapshot: () => ({ progress: { ready } }) },
    document: { querySelector: () => loader },
    requestAnimationFrame: (callback) => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: (key) => frames.delete(key),
  };
  const paint = () => { const queued = [...frames.values()]; frames.clear(); queued.forEach((callback) => callback()); };
  const cancel = afterPublicPaint(() => calls++, browser);
  paint(); ready = true; paint();
  assert.equal(calls, 0);
  ready = false; loader = false; paint();
  assert.equal(calls, 0);
  paint(); assert.equal(calls, 1);
  cancel();
  const cancelNext = afterPublicPaint(() => calls++, browser);
  paint(); cancelNext(); paint();
  assert.equal(calls, 1);
});

test("concurrent preparation generates one identity and preserves returning extension keys", async () => {
  const saved = storage();
  let generated = 0;
  const identity = { generateNostrKeys: async () => {
    generated++;
    saved.setItem("local_nsec", "secret"); saved.setItem("local_npub", "public");
    return { nsec: "secret", npub: "public" };
  } };
  const actions = createPublicIdentityActions(immediateService(identity), saved);
  const first = actions.generateNostrKeys("name");
  assert.equal(first, actions.generateNostrKeys(""));
  await first; await actions.generateNostrKeys("");
  assert.equal(generated, 1);
  saved.setItem("local_nsec", "nip07");
  assert.deepEqual(await actions.generateNostrKeys(""), { nsec: "nip07", npub: "public" });
  assert.equal(generated, 1);
});

test("an early sign-in wins over later automatic preparation; profile writes wait for keys", async () => {
  const saved = storage();
  const events = [];
  const actions = createPublicIdentityActions(immediateService({
    auth: async () => { events.push("auth"); saved.setItem("local_nsec", "signed-in"); saved.setItem("local_npub", "account"); return true; },
    generateNostrKeys: () => { assert.fail("Do not replace the authenticated account"); },
    postNostrContent: () => { events.push(saved.getItem("local_nsec")); return true; },
  }), saved);
  const signIn = actions.auth("signed-in");
  const preparation = actions.generateNostrKeys("");
  await Promise.all([signIn, preparation]);
  assert.equal(await actions.postNostrContent("profile", 0), true);
  assert.deepEqual(events, ["auth", "signed-in"]);
});

test("key-generation failures release the shared attempt for retry", async () => {
  let attempts = 0;
  const actions = createPublicIdentityActions(immediateService({ generateNostrKeys: () => {
    if (++attempts === 1) throw new Error("not ready");
    return { npub: "public", nsec: "secret" };
  } }), storage());
  await assert.rejects(actions.generateNostrKeys(""), /not ready/);
  assert.deepEqual(await actions.generateNostrKeys(""), { npub: "public", nsec: "secret" });
});

test("two public tabs sharing a key lock reuse the first generated identity", async () => {
  const saved = storage();
  let queued = Promise.resolve(), generations = 0;
  const lock = (work) => { const result = queued.then(work); queued = result.catch(() => {}); return result; };
  const backend = immediateService({ generateNostrKeys: async () => {
    generations++;
    await Promise.resolve();
    saved.setItem("local_nsec", "one-secret"); saved.setItem("local_npub", "one-account");
    return { nsec: "one-secret", npub: "one-account" };
  } });
  const one = createPublicIdentityActions(backend, saved, lock);
  const two = createPublicIdentityActions(backend, saved, lock);
  const [first, second] = await Promise.all([one.generateNostrKeys(""), two.generateNostrKeys("")]);
  assert.deepEqual(first, second);
  assert.equal(generations, 1);
});
