import { RateLimitPluginOptions } from "@fastify/rate-limit";

// Global rate limit configuration
export const globalRateLimitConfig: RateLimitPluginOptions = {
  global: true,
  max: 100, // 100 requests
  timeWindow: "1 minute", // per minute
  cache: 10000, // Keep track of 10k IPs in memory
  allowList: ["127.0.0.1"], // Whitelist localhost
  addHeadersOnExceeding: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  addHeaders: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. You can make ${context.max} requests per ${context.after}. Try again later.`,
      retryAfter: context.ttl,
    };
  },
};

// Strict rate limit for PDF processing endpoint (resource intensive)
export const pdfEndpointRateLimitConfig: RateLimitPluginOptions = {
  max: 10, // 10 requests
  timeWindow: "1 hour", // per hour per IP
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `PDF processing rate limit exceeded. Maximum ${context.max} requests per hour. Try again in ${Math.ceil(context.ttl / 1000 / 60)} minutes.`,
      retryAfter: context.ttl,
    };
  },
};

// Lenient rate limit for health check endpoint
export const healthCheckRateLimitConfig: RateLimitPluginOptions = {
  max: 100, // 100 requests
  timeWindow: "1 minute", // per minute
};

