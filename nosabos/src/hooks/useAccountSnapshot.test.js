import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parse } from "@babel/parser";

const source = fs.readFileSync(new URL("./useAccountSnapshot.js", import.meta.url), "utf8");
const declaration = parse(source, { sourceType: "module" }).program.body
  .find(node => node.type === "ExportDefaultDeclaration").declaration;

// Run the actual hook through render/commit/cleanup with a replaying listener.
function harness() {
  const slots = [], effects = [], subscriptions = [], queued = [];
  let cursor = 0;
  const effect = (callback, dependencies) => {
    const index = cursor++;
    const previous = slots[index];
    if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) return;
    effects.push(() => {
      previous?.cleanup?.();
      slots[index] = { dependencies, cleanup: callback() };
    });
  };
  const deps = {
    useRef: current => slots[cursor++] ||= { current },
    useEffect: effect, useLayoutEffect: effect,
    database: {}, doc: (_database, _collection, npub) => npub,
    onSnapshot: (npub, callback) => {
      const listener = { npub, callback, stopped: false };
      subscriptions.push(listener);
      queued.push(() => callback({ npub, xp: 5 }));
      return () => { listener.stopped = true; };
    },
  };
  const hook = new Function(...Object.keys(deps), source.slice(declaration.start, declaration.end)
    + "; return useAccountSnapshot;")(...Object.values(deps));
  return {
    subscriptions,
    render(npub, callback) {
      cursor = 0;
      hook(npub, callback);
      while (effects.length) effects.shift()();
    },
    replay() { while (queued.length) queued.shift()(); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
  };
}

test("snapshot-driven renders keep one listener instead of replaying cached progress", () => {
  const h = harness();
  let renders = 0;
  const render = () => {
    renders++;
    // Like the dev-account overlay, handling a snapshot always changes state.
    h.render("account-a", () => {
      assert.ok(renders < 10, "cached snapshot must not cause a reconnect loop");
      render();
    });
  };
  render();
  h.replay();
  assert.equal(renders, 2);
  assert.equal(h.subscriptions.length, 1);
  assert.equal(h.subscriptions[0].stopped, false);
  h.unmount();
  assert.equal(h.subscriptions[0].stopped, true);
});

test("an attached listener uses the latest committed UI callback", () => {
  const h = harness(), seen = [];
  h.render("account-a", () => seen.push("old language"));
  h.replay();
  h.render("account-a", () => seen.push("new language"));
  h.subscriptions[0].callback({ xp: 10 });
  assert.deepEqual(seen, ["old language", "new language"]);
  assert.equal(h.subscriptions.length, 1);
  h.unmount();
});

test("account switches and logout stop listeners and ignore queued old snapshots", () => {
  const h = harness(), seen = [];
  h.render("", snapshot => seen.push(snapshot.npub));
  assert.equal(h.subscriptions.length, 0);
  h.render("account-a", snapshot => seen.push(snapshot.npub));
  h.render("account-b", snapshot => seen.push(snapshot.npub));
  assert.equal(h.subscriptions[0].stopped, true);
  h.replay();
  assert.deepEqual(seen, ["account-b"]);
  h.render("", snapshot => seen.push(snapshot.npub));
  assert.equal(h.subscriptions[1].stopped, true);
  h.subscriptions[1].callback({ npub: "account-b" });
  assert.deepEqual(seen, ["account-b"]);
  h.unmount();
});
