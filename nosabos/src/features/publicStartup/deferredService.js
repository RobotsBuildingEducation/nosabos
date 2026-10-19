// A click and background warmup share a single request and mounted service.
export function createDeferredService(start) {
  let value;
  let pending;
  let resolve;
  const publish = (service) => { value = service; resolve?.(service); };
  const ready = () => {
    if (value) return Promise.resolve(value);
    if (!pending) {
      pending = new Promise((done, reject) => {
        resolve = done;
        Promise.resolve().then(() => start(publish)).catch((error) => {
          pending = null;
          reject(error);
        });
      });
    }
    return pending;
  };
  return { ready, publish, call: (method, ...args) => ready().then(() => value[method](...args)) };
}
