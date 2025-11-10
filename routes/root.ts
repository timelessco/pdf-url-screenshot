import { FastifyInstance, FastifyPluginAsync } from "fastify";

const rootRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/", async (request, reply) => {
    return { message: "Hello from Hetzner Node server fastify" };
  });
};

export default rootRoute;

