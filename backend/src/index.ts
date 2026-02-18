import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";

import authRoutes from "./routes/auth";
import propertiesRoutes from "./routes/properties";
import tasksRoutes from "./routes/tasks";
import reportsRoutes from "./routes/reports";
import suppliesRoutes from "./routes/supplies";
import linenRoutes from "./routes/linen";
import usersRoutes from "./routes/users";
import ownersRoutes from "./routes/owners";
import accountingRoutes from "./routes/accounting";
import dashboardRoutes from "./routes/dashboard";
import inventoryRoutes from "./routes/inventory";
import expensesRoutes from "./routes/expenses";

const app = new Hono<AppEnv>();

// CORS — allow requests from frontend
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Mount all routes under /api to match existing frontend hook URLs
const api = new Hono<AppEnv>();
api.route("/auth", authRoutes);
api.route("/properties", propertiesRoutes);
api.route("/tasks", tasksRoutes);
api.route("/reports", reportsRoutes);
api.route("/supplies", suppliesRoutes);
api.route("/linen", linenRoutes);
api.route("/users", usersRoutes);
api.route("/owners", ownersRoutes);
api.route("/accounting", accountingRoutes);
api.route("/dashboard", dashboardRoutes);
api.route("/inventory", inventoryRoutes);
api.route("/expenses", expensesRoutes);

app.route("/api", api);

// Health check
app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const port = parseInt(process.env.PORT || "3001", 10);
console.log(`Starting server on port ${port}...`);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`✅ Backend running on http://localhost:${info.port}`);
});
