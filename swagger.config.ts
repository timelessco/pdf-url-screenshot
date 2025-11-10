import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

export const createSwaggerOptions = (serverUrl: string): FastifyDynamicSwaggerOptions => ({
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "PDF Screenshot API",
      description: "A high-performance API that generates thumbnail images from PDF documents and uploads them to Cloudflare R2 storage.",
      version: "1.0.0",
    },
    servers: [
      {
        url: serverUrl,
        description: "API Server",
      },
    ],
    tags: [
      { name: "health", description: "Health check endpoints" },
      { name: "upload", description: "PDF processing and upload endpoints" },
    ],
  },
});

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
  staticCSP: false,
};

