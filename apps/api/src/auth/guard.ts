import type { FastifyReply, FastifyRequest } from "fastify";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "member";
  displayName: string;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;
  if (request.user.role !== "admin") {
    reply.code(403).send({ error: "Forbidden" });
  }
}
