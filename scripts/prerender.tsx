import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import App from "../client/src/App";
import { Router } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import fs from "node:fs/promises";
import { ROUTE_SEO } from "../client/src/seo/routesSeo";
const pages = ["/", "/sales", "/gallery", "/how-it-works", "/resources", "/about", "/contact", "/privacy", "/terms", "/home-staging-tips", "/real-estate-photos", "/virtual-vs-traditional", "/virtual-staging", "/virtual-staging-cost", "/virtual-staging-for-investors", "/virtual-staging-for-real-estate-agents", "/virtual-staging-for-short-term-rentals", "/selling-tips", "/affordable-virtual-staging"];
async function main() {
  const template = await fs.readFile("dist/public/index.html", "utf8");
  await fs.mkdir("dist/prerender", { recursive: true });
  for (const path of pages) {
    if (!ROUTE_SEO[path]) throw new Error(`Missing SEO for ${path}`);
    const body = await new Promise<string>((resolve, reject) => {
      const output = new PassThrough();
      let html = "";
      output.on("data", (chunk) => { html += chunk.toString(); });
      output.on("end", () => resolve(html));
      output.on("error", reject);
      const stream = renderToPipeableStream(<HelmetProvider><Router ssrPath={path}><App /></Router></HelmetProvider>, {
        onAllReady() { stream.pipe(output); }, onError(error) { reject(error); },
      });
    });
    await fs.writeFile(
      `dist/prerender/${encodeURIComponent(path)}.html`,
      template.replace('<div id="root"></div>', `<div id="root">${body}</div>`),
    );
  }
  console.log(`Prerendered ${pages.length} public pages`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
