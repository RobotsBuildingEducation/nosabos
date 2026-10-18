export function createPublicIdentityActions(service, storage, keyLock = (work) => work()) {
  let creating;
  let mutations = Promise.resolve();
  const mutate = (work) => {
    const result = mutations.then(work);
    mutations = result.catch(() => {});
    return result;
  };
  const generateNostrKeys = (name) => {
    if (!creating) {
      creating = mutate(async () => {
        const identity = await service.ready();
        return keyLock(() => {
          const nsec = storage.getItem("local_nsec");
          const npub = storage.getItem("local_npub");
          return nsec && npub ? { nsec, npub } : identity.generateNostrKeys(name);
        });
      }).finally(() => { creating = null; });
    }
    return creating;
  };
  return {
    generateNostrKeys,
    auth: (...args) => mutate(() => service.call("auth", ...args)),
    authWithExtension: (...args) => mutate(() => service.call("authWithExtension", ...args)),
    postNostrContent: async (...args) => { await generateNostrKeys(""); return service.call("postNostrContent", ...args); },
    connectToNostr: async (...args) => { await generateNostrKeys(""); return service.call("connectToNostr", ...args); },
    isNip07Available: () => typeof window !== "undefined" && Boolean(window.nostr),
  };
}
