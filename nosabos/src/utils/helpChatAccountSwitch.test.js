import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";

const source = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
const syntax = parse(source, { sourceType: "module", plugins: ["jsx"] });
const app = syntax.program.body.find(
  (statement) => statement.type === "ExportDefaultDeclaration",
).declaration;
const accountSwitch = app.body.body
  .filter((statement) => statement.type === "VariableDeclaration")
  .flatMap((statement) => statement.declarations)
  .find((declaration) => declaration.id.name === "handleSwitchedAccount").init;

test("switching accounts cancels a help question queued during its first download", async () => {
  const pendingHelpChatPromptRef = { current: "Explain account A's exercise" };
  const storage = new Map([["local_npub", "account-A"]]);
  let activeAccount = "account-A";
  let chatOpen = true;
  let bootstrapped = false;
  const dependencies = {
    pendingHelpChatPromptRef,
    helpChatDisclosure: { onClose: () => { chatOpen = false; } },
    localStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    rememberAccountSwitch: () => {},
    setActiveNpub: (account) => {
      assert.equal(pendingHelpChatPromptRef.current, "");
      assert.equal(chatOpen, false);
      activeAccount = account;
    },
    setActiveNsec: () => {},
    setUser: () => {},
    connectDID: async () => { bootstrapped = true; },
  };
  // Execute the application's event handler with a delayed chat mount and
  // local account storage, without signing in to an external service.
  const switchAccount = new Function(
    ...Object.keys(dependencies),
    `return (${source.slice(accountSwitch.start, accountSwitch.end)});`,
  )(...Object.values(dependencies));

  await switchAccount("account-B", "test-secret");

  assert.equal(activeAccount, "account-B");
  assert.equal(bootstrapped, true);
  assert.equal(storage.get("local_npub"), "account-B");
  assert.equal(pendingHelpChatPromptRef.current, "");
});
