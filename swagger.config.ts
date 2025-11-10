import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

export const createSwaggerOptions = (serverUrl: string): FastifyDynamicSwaggerOptions => ({
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "PDF Screenshot API",
      description: "A high-performance API that generates thumbnail images from PDF documents and uploads them to Cloudflare R2 storage. **Authentication required**: Include your API key in the `Authorization` header as `Bearer YOUR_API_KEY`.",
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Enter your API key (e.g., sk_live_abc123...)',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
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

