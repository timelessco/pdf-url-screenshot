import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { rateLimitResponse, unauthorizedResponse } from "../schemas/common-responses";

const rootRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get("/", {
    onRequest: fastify.verifyBearerAuth,
    schema: {
      description: "Health check endpoint",
      tags: ["health"],
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        ...unauthorizedResponse, // ✨ Reusable!
        ...rateLimitResponse,    // ✨ Reusable!
      },
    },
    handler: async (request, reply) => {
      return { message: "Hello from Hetzner Node server fastify" };
    },
  });
};

export default rootRoute;

