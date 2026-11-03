import type { FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "@hortis/shared";
import { db, uid } from "../db.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { requireAdmin, requireAuth } from "../auth/guard.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: { max: 15, timeWindow: "5 minutes" },
      },
    },
    async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const user = db
      .prepare(
        `SELECT id, email, password_hash, display_name, role FROM users WHERE email = ?`,
      )
      .get(parsed.data.email) as
      | {
          id: string;
          email: string;
          password_hash: string;
          display_name: string;
          role: "admin" | "member";
        }
      | undefined;

    // Constant-time-ish delay on failure path
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      await new Promise((r) => setTimeout(r, 200));
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
      },
    };
  },
  );

  app.post("/api/auth/register", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.data.email);
    if (exists) return reply.code(409).send({ error: "Email already registered" });

    const id = uid();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, role, created_at)
       VALUES (?, ?, ?, ?, 'member', ?)`,
    ).run(
      id,
      parsed.data.email,
      hashPassword(parsed.data.password),
      parsed.data.displayName,
      new Date().toISOString(),
    );

    return { id, email: parsed.data.email, displayName: parsed.data.displayName, role: "member" };
  });

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request) => {
    return { user: request.user };
  });

  app.get("/api/users", { preHandler: requireAdmin }, async () => {
    const rows = db
      .prepare(`SELECT id, email, display_name as displayName, role, created_at as createdAt FROM users`)
      .all();
    return { users: rows };
  });
}
