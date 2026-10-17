// Injected inline into index.html so resource details work before React loads.
// Observe browser activity without wrapping fetch or re-downloading app assets.
(() => {
  const classifyResource = /* loading-activity-classifier */ (() => null);
  let loadingPlans = /* loading-progress-plan */ null;
  const developmentPlanURL = /* loading-development-plan-url */ null;
  const requestedPlans = new Set();
  const initialCard = document.querySelector("[data-startup-initial]");
  const listeners = new Set();
  const pending = new Map();
  const finished = new Set();
  const failedResources = new Set();
  const seenEntries = new Set();
  const activities = new Map();
  let activityOrder = 0;
  let recent = [];
  let count = 0;
  let bytes = 0;
  let snapshot = { rows: [], activities: [], count, size: "" };
  let flushTimer;
  let resourceObserver;
  let mutationObserver;
  let observing = false;
  const successfulResources = new Set();
  const unavailableResources = new Set();
  const readyCode = new Set();
  let shellReady = false;
  let pageKey;
  let completedSteps = new Set();

  const resourceKey = (name) => {
    const url = new URL(name, location.href);
    const semantic = new URLSearchParams();
    for (const key of ["direct", "import", "raw", "sharedworker", "url", "worker"]) {
      if (url.searchParams.has(key)) semantic.set(key, url.searchParams.get(key));
    }
    return `${url.origin}${url.pathname}${semantic.size ? `?${semantic}` : ""}`;
  };
  function requestDevelopmentPlan(key) {
    if (!developmentPlanURL || loadingPlans?.pages[key] || requestedPlans.has(key)) return;
    requestedPlans.add(key);
    // Fetch metadata alongside the page; never delay HTML or fetch the app's
    // resources a second time just to measure their progress.
    window.fetch(`${developmentPlanURL}?page=${encodeURIComponent(key)}`).then((response) => {
      if (!response.ok) throw new Error("Loading plan unavailable");
      return response.json();
    }).then((plan) => {
      loadingPlans = { shell: plan.shell, pages: { ...loadingPlans?.pages, ...plan.pages } };
      if (shellReady) {
        for (const url of plan.shell) {
          const key = resourceKey(url);
          if (!unavailableResources.has(key)) successfulResources.add(key);
        }
      }
      for (const key of readyCode) if (plan.pages[key]) completeCode(key);
      scheduleFlush();
    }).catch(() => {
      // Keep confirmed initialization milestones available if the dev server
      // cannot provide a graph (for example, during a source syntax error).
      requestedPlans.delete(key);
    });
  }
  function planFor(key) {
    return loadingPlans?.pages[key] || {
      resources: [],
      steps: key === "app" ? ["shell", "code", "profile", "access", "lessons", "page"]
        : ["shell", "code", "page"],
    };
  }
  function getProgress() {
    const plan = planFor(pageKey);
    const total = plan.resources.length + plan.steps.length;
    const completed = plan.resources.filter((url) => successfulResources.has(resourceKey(url))).length
      + plan.steps.filter((step) => completedSteps.has(step)).length;
    const failed = plan.resources.some((url) => unavailableResources.has(resourceKey(url)));
    return { completed, total, percentage: Math.floor(completed * 100 / total), ready: completed === total && !failed, failed };
  }
  function beginPage(key) {
    if (key === pageKey) return;
    pageKey = key;
    completedSteps = new Set();
    if (shellReady) completedSteps.add("shell");
    if (readyCode.has(key)) completedSteps.add("code");
    requestDevelopmentPlan(key);
    scheduleFlush();
  }
  function completeCode(key) {
    readyCode.add(key);
    // An evaluated import confirms its static graph loaded, even when Resource
    // Timing is unavailable or a service worker hides transfer information.
    for (const url of planFor(key).resources) {
      const key = resourceKey(url);
      if (!unavailableResources.has(key)) successfulResources.add(key);
    }
    if (key === pageKey) completedSteps.add("code");
    scheduleFlush();
  }
  function setStep(step, ready = true) {
    if (!planFor(pageKey).steps.includes(step)) return;
    if (ready) completedSteps.add(step);
    else completedSteps.delete(step);
    scheduleFlush();
  }

  const formatBytes = (size) => size >= 1048576
    ? `${(size / 1048576).toFixed(1)} MB`
    : size >= 1024 ? `${Math.round(size / 1024)} KB` : `${Math.round(size)} B`;

  function updateActivity(resource, state) {
    const copy = classifyResource(resource.url, resource.type);
    if (!copy) return;
    const activity = activities.get(copy.key) || { copy, pending: new Set(), failed: new Set() };
    if (state === "loading") activity.pending.add(resource.url);
    else {
      activity.pending.delete(resource.url);
      if (state === "failed") activity.failed.add(resource.url);
      else activity.failed.delete(resource.url);
    }
    activity.order = ++activityOrder;
    activities.set(copy.key, activity);
    if (activities.size > 24) {
      const oldest = [...activities].sort((a, b) => a[1].order - b[1].order)[0][0];
      activities.delete(oldest);
    }
  }

  function describe(name, initiator = "") {
    let url;
    try { url = new URL(name, location.href); } catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    // Fragments aren't sent with requests or included in Resource Timing URLs.
    url.hash = "";
    let filename = url.pathname.split("/").filter(Boolean).pop() || url.hostname;
    try { filename = decodeURIComponent(filename); } catch { /* Keep encoded filenames. */ }
    // Never display URL queries or fragments (they can contain account tokens).
    filename = filename.replace(/[?#].*$/, "").replace(/\p{Cc}/gu, "").slice(0, 180);
    const type = /\.(?:m?js|jsx|tsx?)$/i.test(filename) ? "JavaScript"
      : /\.css$/i.test(filename) || url.hostname === "fonts.googleapis.com" ? "Stylesheet"
      : /\.(?:woff2?|ttf|otf)$/i.test(filename) ? "Font"
      : /\.(?:png|jpe?g|webp|svg|avif|gif|ico)$/i.test(filename) ? "Image"
      : /\.(?:mp3|wav|ogg|m4a|mp4|webm)$/i.test(filename) ? "Media"
      : ["fetch", "xmlhttprequest"].includes(initiator) ? "Request" : "Resource";
    return {
      url: url.href,
      name: url.origin === location.origin ? filename : `${url.hostname} / ${filename}`,
      type,
    };
  }

  function flush() {
    flushTimer = undefined;
    snapshot = {
      rows: [...Array.from(pending.values()).slice(-2).reverse(), ...recent].slice(0, 5),
      activities: [...activities.values()].sort((a, b) => Number(b.pending.size > 0) - Number(a.pending.size > 0) || b.order - a.order).slice(0, 5).map((activity) => {
        const state = activity.failed.size ? "failed" : activity.pending.size ? "loading" : "ready";
        return { key: activity.copy.key, state, message: activity.copy[state] };
      }),
      count,
      size: bytes ? formatBytes(bytes) : "",
      progress: getProgress(),
    };
    if (initialCard?.isConnected) {
      const bar = initialCard.querySelector('[role="progressbar"]');
      const fill = initialCard.querySelector(".startup-loading__fill");
      const percentage = initialCard.querySelector(".startup-loading__percentage");
      const retry = initialCard.querySelector(".startup-loading__retry");
      bar?.setAttribute("aria-valuenow", String(snapshot.progress.percentage));
      bar?.setAttribute("data-ready", String(snapshot.progress.ready));
      if (fill) fill.style.width = `${snapshot.progress.percentage}%`;
      if (percentage) percentage.textContent = `${snapshot.progress.percentage}% ready`;
      if (retry) retry.hidden = !snapshot.progress.failed;
      const log = initialCard.querySelector(".startup-loading__resources");
      if (log) {
        const items = snapshot.activities.map((activity) => {
          const item = document.createElement("li");
          item.className = "startup-loading__activity";
          item.dataset.state = activity.state;
          const indicator = document.createElement("span");
          indicator.className = "startup-loading__activity-indicator";
          indicator.setAttribute("aria-hidden", "true");
          indicator.textContent = activity.state === "ready" ? "✓" : activity.state === "failed" ? "!" : "•";
          const message = document.createElement("span");
          message.textContent = activity.message;
          item.append(indicator, message);
          return item;
        });
        log.replaceChildren(...items);
      }
    }
    listeners.forEach((listener) => listener());
    // Stop tracking when the page is ready. A later loading screen restarts it.
    if (!initialCard?.isConnected && listeners.size === 0) stop();
  }

  function scheduleFlush() {
    // Batch busy module graphs without adding work for every individual file.
    if (flushTimer === undefined) flushTimer = window.setTimeout(flush, 100);
  }

  function receive(entries) {
    for (const entry of entries) {
      // Completion callbacks can arrive out of timestamp order. Deduplicate
      // individual entries rather than dropping ones older than the last event.
      const key = `${entry.name}|${entry.startTime}|${entry.duration}`;
      if (seenEntries.has(key)) continue;
      seenEntries.add(key);
      if (seenEntries.size > 4096) seenEntries.delete(seenEntries.values().next().value);
      const resource = describe(entry.name, entry.initiatorType);
      if (!resource) continue;
      pending.delete(resource.url);
      finished.add(resource.url);
      if (finished.size > 2048) finished.delete(finished.values().next().value);
      if (entry.responseStatus >= 200 && entry.responseStatus < 400) failedResources.delete(resource.url);
      const failed = entry.responseStatus >= 400 || failedResources.has(resource.url);
      const progressKey = resourceKey(resource.url);
      if (failed) {
        successfulResources.delete(progressKey);
        unavailableResources.add(progressKey);
      } else {
        unavailableResources.delete(progressKey);
        successfulResources.add(progressKey);
      }
      count += 1;
      bytes += entry.encodedBodySize || 0;
      const size = entry.transferSize > 0 ? `${formatBytes(entry.transferSize)} transferred`
        : entry.encodedBodySize > 0 ? `${formatBytes(entry.encodedBodySize)} resource` : "";
      const received = entry.transferSize > 0 || entry.encodedBodySize > 0 || entry.responseStatus >= 200;
      // Older browsers omit deliveryType. Exposed body bytes with no network
      // transfer indicate local cache; exclude service-worker responses because
      // their underlying network transfers may not be exposed to this page.
      const cached = entry.deliveryType === "cache" || (
        entry.transferSize === 0 && entry.encodedBodySize > 0 && entry.workerStart === 0
      );
      const status = failed ? (entry.responseStatus >= 400 ? `Failed (${entry.responseStatus})` : "Failed")
        : cached ? "Cached" : received ? "Received" : "Finished";
      updateActivity(resource, failed ? "failed" : "ready");
      recent = [{
        ...resource,
        status,
        detail: [resource.type, size, `${Math.round(entry.duration)} ms`].filter(Boolean).join(" · "),
      }, ...recent.filter((row) => row.url !== resource.url)].slice(0, 5);
    }
    scheduleFlush();
  }

  function request(element) {
    if (!element.matches?.('script[src], link[rel~="stylesheet"], link[rel~="modulepreload"], link[rel~="preload"]')) return;
    const resource = describe(element.src || element.href);
    if (!resource || pending.has(resource.url) || finished.has(resource.url)) return;
    pending.set(resource.url, { ...resource, status: "Requested", detail: resource.type });
    updateActivity(resource, "loading");
    if (pending.size > 64) pending.delete(pending.keys().next().value);
    scheduleFlush();
  }

  function onError(event) {
    if (!event.target?.matches?.("script[src], link[href], img[src], audio[src], video[src], source[src]")) return;
    const resource = describe(event.target?.src || event.target?.href || "");
    // A timing entry can arrive before the element's error event, so don't
    // require it to still be pending before correcting its completion label.
    if (!resource) return;
    pending.delete(resource.url);
    failedResources.add(resource.url);
    successfulResources.delete(resourceKey(resource.url));
    unavailableResources.add(resourceKey(resource.url));
    updateActivity(resource, "failed");
    if (failedResources.size > 64) failedResources.delete(failedResources.values().next().value);
    recent = [{ ...resource, status: "Failed", detail: "Could not load this file" }, ...recent.filter((row) => row.url !== resource.url)].slice(0, 5);
    scheduleFlush();
  }

  function start() {
    if (observing) return;
    observing = true;
    try {
      receive(performance.getEntriesByType("resource"));
      resourceObserver = new PerformanceObserver((list) => receive(list.getEntries()));
      resourceObserver.observe({ type: "resource", buffered: true });
    } catch { /* Script and stylesheet requests still work without Resource Timing. */ }
    document.querySelectorAll("script[src], link[href]").forEach(request);
    mutationObserver = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) {
        request(node);
        node.querySelectorAll?.("script[src], link[href]").forEach(request);
      }
      scheduleFlush();
    });
    mutationObserver.observe(document.head, { childList: true, subtree: true });
    // Only observe the root's direct children, not mutations inside the app.
    const root = document.getElementById("root");
    if (root) mutationObserver.observe(root, { childList: true });
    window.addEventListener("error", onError, true);
    scheduleFlush();
  }

  function stop() {
    resourceObserver?.disconnect();
    mutationObserver?.disconnect();
    window.removeEventListener("error", onError, true);
    window.clearTimeout(flushTimer);
    flushTimer = undefined;
    observing = false;
  }

  window.__piyaliStartupResources = {
    getSnapshot: () => snapshot,
    whenStylesReady() {
      return Promise.all([...document.querySelectorAll("link[data-startup-stylesheet]")].map((link) => {
        if (link.dataset.startupLoaded === "true") return undefined;
        return new Promise((resolve) => link.addEventListener("load", resolve, { once: true }));
      }));
    },
    beginPage,
    completeCode,
    setStep,
    flushNow() {
      window.clearTimeout(flushTimer);
      flush();
    },
    completeShell() {
      shellReady = true;
      for (const url of loadingPlans?.shell || []) {
        const key = resourceKey(url);
        if (!unavailableResources.has(key)) successfulResources.add(key);
      }
      completedSteps.add("shell");
      scheduleFlush();
    },
    subscribe(listener) {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
        if (!initialCard?.isConnected && listeners.size === 0) stop();
      };
    },
  };
  initialCard?.querySelector(".startup-loading__retry")?.addEventListener("click", () => location.reload());
  let authenticated = false;
  try { authenticated = Boolean(localStorage.getItem("local_nsec")?.trim()); } catch { /* Signed-out shell. */ }
  const path = location.pathname || "/";
  const segment = path.split("/")[1];
  const initialPage = ["links", "legacy-links", "orbing", "squircle", "citizenship", "patreon-return"].includes(segment)
    ? segment : segment === "proficiency" ? (authenticated ? "proficiency" : "landing")
      : authenticated ? "app" : "landing";
  // Discover the active public route alongside the shell, rather than waiting
  // for React to request it. Other routes stay outside the initial download.
  if (!developmentPlanURL && ["landing", "links"].includes(initialPage)) {
    const shell = new Set(loadingPlans?.shell || []);
    for (const href of loadingPlans?.pages[initialPage]?.resources || []) {
      if (shell.has(href) || !href.endsWith(".js")) continue;
      const link = document.createElement("link");
      link.rel = "modulepreload";
      link.crossOrigin = "";
      link.href = href;
      document.head.appendChild(link);
    }
  }
  beginPage(initialPage);
  start();
})();
