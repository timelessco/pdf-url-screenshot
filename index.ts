import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import { envSchema } from "./env.schema";
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

    // Register routes
    await fastify.register(rootRoute);
    await fastify.register(pdfScreenshotRoute);

    await fastify.listen({ port: fastify.config.PORT, host: "0.0.0.0" });
    console.log(`Server running at http://localhost:${fastify.config.PORT}`);
  } catch (err) {
    console.error(`[FAILED] at fastify.listen()`, err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
