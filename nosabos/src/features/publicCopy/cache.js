// Keep one request per page/locale; a failed selection can be retried.
export function createPublicCopyCache(loaders) {
  const records = new Map();
  const resolve = (page, language) => {
    if (!loaders[page]) throw new Error("Unknown public page");
    const requested = String(language || "en").toLowerCase().split(/[-_]/)[0];
    const locale = Object.hasOwn(loaders[page], requested) ? requested : "en";
    return { locale, key: `${page}:${locale}` };
  };
  const load = (page, language) => {
    const { locale, key } = resolve(page, language);
    const previous = records.get(key);
    if (previous && previous.status !== "rejected") return previous.promise;
    const record = { status: "pending" };
    record.promise = Promise.resolve().then(() => loaders[page][locale]()).then((value) => {
      record.status = "fulfilled";
      record.value = value;
      return value;
    }, (error) => { record.status = "rejected"; record.error = error; throw error; });
    records.set(key, record);
    return record.promise;
  };
  return {
    load,
    read(page, language) {
      const { key } = resolve(page, language);
      const record = records.get(key);
      if (record?.status === "fulfilled") return record.value;
      if (record?.status === "rejected") throw record.error;
      throw record?.promise || load(page, language);
    },
  };
}
