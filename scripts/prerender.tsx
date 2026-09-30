import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import fs from "node:fs/promises";
import Layout from "../client/src/components/layout/Layout";
import { ROUTE_SEO } from "../client/src/seo/routesSeo";
import Page0 from "../client/src/pages/Home";
import Page1 from "../client/src/pages/Sales";
import Page2 from "../client/src/pages/Gallery";
import Page3 from "../client/src/pages/HowItWorks";
import Page4 from "../client/src/pages/Resources";
import Page5 from "../client/src/pages/About";
import Page6 from "../client/src/pages/Contact";
import Page7 from "../client/src/pages/PrivacyPolicy";
import Page8 from "../client/src/pages/TermsOfService";
import Page9 from "../client/src/pages/HomeStagingTips";
import Page10 from "../client/src/pages/RealEstatePhotos";
import Page11 from "../client/src/pages/VirtualVsTraditional";
import Page12 from "../client/src/pages/VirtualStaging";
import Page13 from "../client/src/pages/VirtualStagingCost";
import Page14 from "../client/src/pages/VirtualStagingForInvestors";
import Page15 from "../client/src/pages/VirtualStagingForAgents";
import Page16 from "../client/src/pages/VirtualStagingForShortTermRentals";
import Page17 from "../client/src/pages/SellingTips";
import Page18 from "../client/src/pages/AffordableVirtualStaging";
const pages = {
  "/": Page0,
  "/sales": Page1,
  "/gallery": Page2,
  "/how-it-works": Page3,
  "/resources": Page4,
  "/about": Page5,
  "/contact": Page6,
  "/privacy": Page7,
  "/terms": Page8,
  "/home-staging-tips": Page9,
  "/real-estate-photos": Page10,
  "/virtual-vs-traditional": Page11,
  "/virtual-staging": Page12,
  "/virtual-staging-cost": Page13,
  "/virtual-staging-for-investors": Page14,
  "/virtual-staging-for-real-estate-agents": Page15,
  "/virtual-staging-for-short-term-rentals": Page16,
  "/selling-tips": Page17,
  "/affordable-virtual-staging": Page18,
};
async function main() {
  const template = await fs.readFile("dist/public/index.html", "utf8");
  await fs.mkdir("dist/prerender", { recursive: true });
  for (const [path, Page] of Object.entries(pages)) {
    if (!ROUTE_SEO[path]) throw new Error(`Missing SEO for ${path}`);
    const body = renderToString(
      <HelmetProvider>
        <QueryClientProvider client={new QueryClient()}>
          <Router ssrPath={path}>
            <Layout>
              <Page />
            </Layout>
          </Router>
        </QueryClientProvider>
      </HelmetProvider>,
    );
    await fs.writeFile(
      `dist/prerender/${encodeURIComponent(path)}.html`,
      template.replace('<div id="root"></div>', `<div id="root">${body}</div>`),
    );
  }
  console.log(`Prerendered ${Object.keys(pages).length} public pages`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
