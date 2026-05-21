import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-da50176a/health", (c) => {
  return c.json({ status: "ok" });
});

// Track a visit
app.post("/make-server-da50176a/track-visit", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const timestamp = Date.now();
    const id = crypto.randomUUID();
    const key = `visit:${timestamp}:${id}`;
    
    const visitData = {
      id,
      timestamp,
      date: new Date(timestamp).toISOString(),
      userAgent: c.req.header("user-agent") || "Unknown Device",
      ip: c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "Unknown IP",
      path: body.path || "/",
    };

    await kv.set(key, visitData);
    return c.json({ success: true, id });
  } catch (error) {
    console.error("Error tracking visit:", error);
    return c.json({ success: false, error: "Failed to track visit" }, 500);
  }
});

// Get all visits
app.get("/make-server-da50176a/visits", async (c) => {
  try {
    const visits = await kv.getByPrefix("visit:");
    
    // Sort visits by timestamp descending (newest first)
    visits.sort((a, b) => b.timestamp - a.timestamp);
    
    return c.json({ success: true, visits });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return c.json({ success: false, error: "Failed to fetch visits" }, 500);
  }
});

Deno.serve(app.fetch);
