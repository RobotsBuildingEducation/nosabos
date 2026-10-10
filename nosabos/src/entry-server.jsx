import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { PassThrough } from "node:stream";
import { PublicApp } from "./main.jsx";
import useLanguage from "./hooks/useLanguage.js";

export function renderPublicPage(path, locale) {
  useLanguage.getState().setLanguage(locale, { navigate: false });
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.setEncoding("utf8");
    output.on("data", chunk => { html += chunk; });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(<PublicApp RouterComponent={StaticRouter} routerProps={{ location: path }} publicLocale={locale} />, {
      onAllReady() { stream.pipe(output); },
      onShellError(error) { reject(error); },
      onError(error) { reject(error); },
    });
  });
}
