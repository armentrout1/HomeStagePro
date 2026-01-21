import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy for Railway/production environments (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Canonical host + HTTPS + trailing slash normalization (non-API routes)
// Only apply in production - skip in development so localhost works
app.use((req, res, next) => {
  if (app.get("env") === "development") {
    return next();
  }

  if (req.path === "/api" || req.path.startsWith("/api/")) {
    return next();
  }

  const normalizeHeader = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const forwardedProto = normalizeHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = normalizeHeader(req.headers["x-forwarded-host"]);
  const currentProtocol = (forwardedProto ?? req.protocol ?? "http").split(",")[0].trim();
  const currentHost = (forwardedHost ?? req.headers.host ?? "").split(",")[0].trim();

  if (!currentHost) {
    return next();
  }

  const originalUrl = req.originalUrl || "/";
  const queryIndex = originalUrl.indexOf("?");
  let pathname = queryIndex >= 0 ? originalUrl.slice(0, queryIndex) : originalUrl;
  const search = queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";

  let redirectRequired = false;
  if (pathname === "/gallery") {
    pathname = "/gallery/";
    redirectRequired = true;
  }

  let targetHost = currentHost.toLowerCase().startsWith("www.")
    ? currentHost.slice(4)
    : currentHost;

  if (targetHost !== currentHost) {
    redirectRequired = true;
  }

  const protocolIsHttps = currentProtocol === "https";
  if (!protocolIsHttps) {
    redirectRequired = true;
  }

  if (!redirectRequired) {
    return next();
  }

  const redirectUrl = `https://${targetHost}${pathname}${search}`;
  return res.redirect(301, redirectUrl);
});

const supabaseOrigin = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).origin
  : null;

const scriptSrc = [
  "'self'",
  "https://js.stripe.com",
  "https://www.googletagmanager.com",
];
if (app.get("env") !== "production") {
  scriptSrc.push("'unsafe-inline'", "https://replit.com");
} else {
  // Add SHA-256 hashes for the gtag inline script in index.html
  // Multiple hashes to cover different line ending scenarios across build environments
  scriptSrc.push(
    "'sha256-CkLZ17YGr5CcHZ6hFClRQVEB0MQzzEJEuZTbGSUvRS0='",
    "'sha256-a5/4LESxLxxYh6mBEAsjCui0e3VpaYN8SV/OK9fNX+o='",
    "'sha256-ofOD6fiAsejiBDJU1dPJkX4m6Wo64Uy/F0UgyaBisMo='",
  );
}

app.use(
  helmet({
    // Disable HSTS in development so localhost works without HTTPS
    strictTransportSecurity: app.get("env") !== "development",
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": scriptSrc,
        "script-src-attr": ["'self'"],
        "img-src": [
          "'self'",
          "data:",
          "https://images.openai.com",
          "https://images.unsplash.com",
          "https://www.googletagmanager.com",
          "https://www.google.com",
          "https://www.google-analytics.com",
          "https://fonts.gstatic.com",
          "https://googleads.g.doubleclick.net",
          "https://td.doubleclick.net",
          "https://pagead2.googlesyndication.com",
          "https://*.googlesyndication.com",
          ...(supabaseOrigin ? [supabaseOrigin] : []),
        ],
        "frame-src": [
          "'self'",
          "https://js.stripe.com",
          "https://hooks.stripe.com",
          "https://www.google.com",
          "https://tagassistant.google.com",
        ],
        "connect-src": [
          "'self'",
          "https://api.stripe.com",
          "https://www.google-analytics.com",
          "https://region1.google-analytics.com",
          "https://www.googletagmanager.com",
          "https://stats.g.doubleclick.net",
          "https://analytics.google.com",
          "https://tagassistant.google.com",
          ...(supabaseOrigin ? [supabaseOrigin] : []),
        ],
      },
    },
  }),
);

// Increase the JSON payload size limit to 50MB and capture raw body for Stripe webhooks
app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  if (process.env.DISABLE_USAGE_LIMITS === 'true') {
    log('Usage limits disabled (DISABLE_USAGE_LIMITS=true)');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
