import { ROUTE_SEO } from "../client/src/seo/routesSeo";
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

const SITE_ORIGIN = "https://roomstagerpro.com";

/**
 * Check if request is a legitimate SPA navigation request
 */
function isSpaNavigationRequest(req: express.Request): boolean {
  // Must be GET request
  if (req.method !== "GET") return false;

  // Must accept HTML content
  const acceptHeader = req.headers.accept || "";
  if (!acceptHeader.includes("text/html")) return false;

  const pathname = req.path;

  // Exclude API routes
  if (pathname.startsWith("/api")) return false;

  // Exclude assets
  if (pathname.startsWith("/assets")) return false;

  // Exclude known public files with extensions
  const publicFiles = [
    "/robots.txt",
    "/favicon.ico",
    "/sitemap.xml",
    "/ads.txt",
  ];
  if (publicFiles.some((file) => pathname === file)) return false;

  // Exclude paths with file extensions (likely static files)
  const lastSegment = pathname.split("/").pop() || "";
  if (lastSegment.includes(".")) return false;

  return true;
}

/**
 * Check if path is a blocked probe path
 */
function isBlockedProbePath(pathname: string): boolean {
  // Block any segment starting with dot
  if (pathname.split("/").some((segment) => segment.startsWith("."))) {
    return true;
  }

  // Block sensitive prefixes
  const blockedPrefixes = [
    "/config",
    "/configs",
    "/secrets",
    "/secret",
    "/storage",
    "/backend",
    "/admin/config",
    "/.aws",
    "/.github",
    "/.circleci",
    "/.travis",
    "/.gitlab",
    "/.bitbucket",
  ];

  if (blockedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Block common sensitive filenames and extensions
  const blockedPatterns = [
    /(^|\/)\.env(\.|$)/i,
    /(^|\/)\.aws(\/|$)/i,
    /(^|\/)\.git(\/|$)/i,
    /(^|\/)credentials(\.|$)/i,
    /(^|\/)id_rsa(\.|$)/i,
    /(^|\/)stripe\.key(\.|$)/i,
    /(^|\/)secrets\.yml(\.|$)/i,
    /(^|\/)config\.php(\.|$)/i,
    /(^|\/)parameters\.yml(\.|$)/i,
    /\.yml$/i,
    /\.yaml$/i,
    /\.ini$/i,
    /\.log$/i,
    /\.sql$/i,
    /\.bak$/i,
    /\.zip$/i,
    /\.tar$/i,
    /\.gz$/i,
    /\.key$/i,
    /\.pem$/i,
    /\.crt$/i,
    /\.p12$/i,
  ];

  return blockedPatterns.some((pattern) => pattern.test(pathname));
}

// Canonical paths for SEO - must match client/src/seo/routesSeo.ts
const CANONICAL_PATHS: Record<string, string> = {
  "/": "/",
  "/home-staging-tips": "/home-staging-tips",
  "/real-estate-photos": "/real-estate-photos",
  "/virtual-vs-traditional": "/virtual-vs-traditional",
  "/virtual-staging": "/virtual-staging",
  "/virtual-staging-cost": "/virtual-staging-cost",
  "/virtual-staging-for-investors": "/virtual-staging-for-investors",
  "/virtual-staging-for-real-estate-agents":
    "/virtual-staging-for-real-estate-agents",
  "/virtual-staging-for-short-term-rentals":
    "/virtual-staging-for-short-term-rentals",
  "/gallery": "/gallery",
  "/how-it-works": "/how-it-works",
  "/selling-tips": "/selling-tips",
  "/affordable-virtual-staging": "/affordable-virtual-staging",
  "/sales": "/sales",
  "/upgrade": "/upgrade",
  "/thank-you": "/thank-you",
  "/resources": "/resources",
  "/privacy": "/privacy",
  "/terms": "/terms",
  "/about": "/about",
  "/contact": "/contact",
};

// Routes that should have noindex
const NOINDEX_ROUTES = ["/upgrade", "/thank-you"];

/**
 * Get the canonical URL for a given path
 */
function getCanonicalUrl(requestPath: string): string {
  // Normalize path: remove trailing slash (except for root)
  let normalizedPath = requestPath;
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  const canonicalPath = CANONICAL_PATHS[normalizedPath] ?? "/";
  return `${SITE_ORIGIN}${canonicalPath}`;
}

/**
 * Check if a route should be noindex
 */
function shouldNoindex(requestPath: string): boolean {
  let normalizedPath = requestPath;
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return NOINDEX_ROUTES.includes(normalizedPath);
}

/**
 * Inject correct canonical and robots meta into HTML based on the request path
 */
export function injectSeoTags(html: string, requestPath: string): string {
  const seo = ROUTE_SEO[requestPath] || {
    title: "Page not found | RoomStagerPro",
    description: "This page could not be found.",
    canonicalPath: requestPath,
    robots: "noindex, follow",
    ogImage: "/images/meta-preview.png",
  };
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const url = SITE_ORIGIN + seo.canonicalPath;
  let result = html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/g, "")
    .replace(
      /<meta[^>]+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,
      "",
    )
    .replace(/<link[^>]+rel="canonical"[^>]*>/g, "");
  const tags = `<title data-rh="true">${escape(seo.title)}</title>
    <meta data-rh="true" name="description" content="${escape(seo.description)}"/>
    <meta data-rh="true" name="robots" content="${escape(seo.robots || "index, follow")}"/>
    <link data-rh="true" rel="canonical" href="${escape(url)}"/>
    <meta data-rh="true" property="og:title" content="${escape(seo.title)}"/>
    <meta data-rh="true" property="og:description" content="${escape(seo.description)}"/>
    <meta data-rh="true" property="og:url" content="${escape(url)}"/>
    <meta data-rh="true" property="og:type" content="website"/>
    <meta data-rh="true" property="og:image" content="${SITE_ORIGIN}${seo.ogImage || "/images/meta-preview.png"}"/>`;
  return result.replace("</head>", tags + "</head>");
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const {
    createServer: createViteServer,
    createLogger,
    defineConfig,
  } = await import("vite");
  const react = (await import("@vitejs/plugin-react")).default;
  const themePlugin = (await import("@replit/vite-plugin-shadcn-theme-json"))
    .default;
  const runtimeErrorOverlay = (
    await import("@replit/vite-plugin-runtime-error-modal")
  ).default;

  const plugins = [react(), runtimeErrorOverlay(), themePlugin()];

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  const projectRoot = path.resolve(import.meta.dirname, "..");
  const viteConfig = defineConfig({
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    root: path.resolve(projectRoot, "client"),
    build: {
      outDir: path.resolve(projectRoot, "dist", "public"),
      emptyOutDir: true,
    },
  });
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Block probe paths BEFORE Vite middleware (otherwise Vite returns index.html with 200)
  app.use((req, res, next) => {
    if (isBlockedProbePath(req.path)) {
      return res.status(404).send("Not found");
    }
    next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const requestPath = url.split("?")[0]; // Remove query string

    // Block probe paths
    if (isBlockedProbePath(req.path)) {
      return res.status(404).send("Not found");
    }

    // Only serve SPA for legitimate navigation requests
    if (!isSpaNavigationRequest(req)) {
      return res.status(404).send("Not found");
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Inject correct canonical and robots meta for this route
      template = injectSeoTags(template, requestPath);

      const page = await vite.transformIndexHtml(url, template);
      res
        .status(
          ROUTE_SEO[requestPath] || requestPath === "/dev/feedback" ? 200 : 404,
        )
        .set({ "Content-Type": "text/html" })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, _filePath) {
        const urlPath = res.req?.url ?? "";

        if (urlPath.startsWith("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }

        if (urlPath.startsWith("/hero/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }

        if (
          urlPath.startsWith("/staging-examples/") ||
          urlPath.startsWith("/sample-images/")
        ) {
          res.setHeader("Cache-Control", "public, max-age=604800");
          return;
        }

        res.setHeader("Cache-Control", "public, max-age=0");
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  // Inject correct canonical and robots meta based on the request path
  app.use("*", (req, res) => {
    const requestPath = req.originalUrl.split("?")[0]; // Remove query string

    // Block probe paths
    if (isBlockedProbePath(req.path)) {
      return res.status(404).send("Not found");
    }

    // Only serve SPA for legitimate navigation requests
    if (!isSpaNavigationRequest(req)) {
      return res.status(404).send("Not found");
    }

    const prebuilt = path.resolve(
      distPath,
      "../prerender",
      encodeURIComponent(requestPath) + ".html",
    );
    const indexPath =
      ROUTE_SEO[requestPath] && fs.existsSync(prebuilt)
        ? prebuilt
        : path.resolve(distPath, "index.html");

    fs.readFile(indexPath, "utf-8", (err, html) => {
      if (err) {
        res.status(500).send("Error loading page");
        return;
      }

      const modifiedHtml = injectSeoTags(html, requestPath);
      res
        .status(ROUTE_SEO[requestPath] ? 200 : 404)
        .set("Content-Type", "text/html")
        .send(modifiedHtml);
    });
  });
}
