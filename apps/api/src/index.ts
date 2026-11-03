import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config.js";
import { ensureAdminUser } from "./auth/bootstrap.js";
import { authRoutes } from "./routes/auth.js";
import { plantRoutes } from "./routes/plants.js";
import { careRoutes } from "./routes/care.js";
import { bonsaiRoutes } from "./routes/bonsai.js";
import { gardenRoutes } from "./routes/garden.js";
import { opsRoutes } from "./routes/ops.js";
import { settingsRoutes } from "./routes/settings.js";
import { uploadRoutes } from "./routes/uploads.js";
import { collabRoutes } from "./routes/collab.js";
import { growRoutes } from "./routes/grow.js";
import "./db.js";

mkdirSync(config.uploadDir, { recursive: true });
ensureAdminUser();

const app = Fastify({
  logger: true,
  bodyLimit: 12 * 1024 * 1024,
});

const corsOrigin =
  config.corsOrigin === "*"
    ? true
    : config.corsOrigin.split(",").map((s) => s.trim());

await app.register(cors, {
  origin: corsOrigin,
  credentials: true,
});

app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("Permissions-Policy", "camera=(self), microphone=()");
  reply.header("X-Hortis-Mode", "server");
  return payload;
});

await app.register(jwt, { secret: config.jwtSecret });
await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
});
await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024 } });
await app.register(fastifyStatic, {
  root: config.uploadDir,
  prefix: "/uploads/",
  decorateReply: false,
});

await app.register(authRoutes);
await app.register(plantRoutes);
await app.register(careRoutes);
await app.register(bonsaiRoutes);
await app.register(gardenRoutes);
await app.register(opsRoutes);
await app.register(settingsRoutes);
await app.register(uploadRoutes);
await app.register(collabRoutes);
await app.register(growRoutes);

const webDist = resolve(process.cwd(), "../web/dist");
if (existsSync(webDist)) {
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
  });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api") || request.url.startsWith("/uploads")) {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html");
  });
}

app.listen({ port: config.port, host: config.host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
