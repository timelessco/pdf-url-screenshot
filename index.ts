import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyBearerAuth from "@fastify/bearer-auth";
import { envSchema } from "./env.schema";
import { createSwaggerOptions, swaggerUiOptions } from "./swagger.config";
import { globalRateLimitConfig } from "./rate-limit.config";
import rootRoute from "./routes/root";
import pdfScreenshotRoute from "./routes/upload/pdf-screenshot";

// Initialize Fastify
const fastify = Fastify({
  logger: true,
});

// Start server
const start = async () => {
  try {
    // Register environment variables plugin
    await fastify.register(fastifyEnv, {
      dotenv: true,
      schema: envSchema,
    });

    console.log(`[Starting] Fastify server on port ${fastify.config.PORT}`);
    console.log(`[Config] R2 Account ID: ${fastify.config.R2_ACCOUNT_ID}`);
    console.log(`[Config] R2 Bucket: ${fastify.config.R2_MAIN_BUCKET_NAME}`);
    console.log(`[Config] Server URL: ${fastify.config.SERVER_URL}`);

    // Register rate limiting
    await fastify.register(fastifyRateLimit, globalRateLimitConfig);
    console.log(`[Rate Limit] Global: ${globalRateLimitConfig.max} requests per ${globalRateLimitConfig.timeWindow}`);

    // Register Swagger for API documentation (must be before auth to make /docs public)
    await fastify.register(fastifySwagger, createSwaggerOptions(fastify.config.SERVER_URL));
    await fastify.register(fastifySwaggerUI, swaggerUiOptions);
    console.log(`[API Docs] Public documentation available at /docs`);

    // Register bearer authentication with exclusions
    const apiKeys = new Set(
      fastify.config.API_KEYS
        ? fastify.config.API_KEYS.split(',').map(key => key.trim()).filter(key => key.length > 0)
        : []
    );
    
    if (apiKeys.size > 0) {
      await fastify.register(fastifyBearerAuth, {
        keys: apiKeys,
        errorResponse: (err) => ({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or missing API key. Include "Authorization: Bearer YOUR_API_KEY" header.',
        }),
        addHook: false, // Don't add global hook, we'll apply selectively
      });
      console.log(`[Auth] Bearer authentication enabled with ${apiKeys.size} API key(s)`);
    } else {
      console.warn(`[Auth] WARNING: No API keys configured. API is publicly accessible!`);
    }

    // Register routes
    await fastify.register(rootRoute);
    await fastify.register(pdfScreenshotRoute);

    console.log(`[API Docs] Available at http://localhost:${fastify.config.PORT}/docs`);

    await fastify.listen({ port: fastify.config.PORT, host: "0.0.0.0" });
    console.log(`Server running at http://localhost:${fastify.config.PORT}`);
  } catch (err) {
    console.error(`[FAILED] at fastify.listen()`, err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
