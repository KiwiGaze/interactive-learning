import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import type { CatalogRegistry } from "./catalog.js";
import type { SessionStore } from "./session-store.js";

export interface HttpServerDeps {
  store: SessionStore;
  catalog: CatalogRegistry;
  spaDir: string;
  port: number;
}

export async function buildHttpServer(deps: HttpServerDeps): Promise<{
  fastify: FastifyInstance;
  port: number;
}> {
  const fastify = Fastify({ logger: false });
  await fastify.register(fastifyStatic, {
    root: deps.spaDir,
    prefix: "/",
    wildcard: false,
  });

  fastify.get("/healthz", async () => ({ ok: true, session: deps.store.id }));
  fastify.get("/closed", async (_req, reply) => reply.sendFile("index.html"));
  fastify.setNotFoundHandler(async (_req, reply) => reply.sendFile("index.html"));

  await fastify.listen({ host: "127.0.0.1", port: deps.port });
  const addr = fastify.server.address();
  const resolvedPort = typeof addr === "object" && addr ? addr.port : deps.port;
  return { fastify, port: resolvedPort };
}
