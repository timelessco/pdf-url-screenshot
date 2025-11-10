/**
 * Common response schemas for reuse across all routes
 * Prevents duplication and ensures consistency
 */

export const rateLimitResponse = {
  429: {
    type: "object",
    properties: {
      statusCode: { type: "number" },
      error: { type: "string" },
      message: { type: "string" },
      retryAfter: { type: "number" },
    },
    description: "Rate limit exceeded. Check x-ratelimit-* headers for details.",
  },
};

export const serverErrorResponse = {
  500: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      error: { type: "string" },
      details: { type: "string" },
    },
    description: "Internal server error",
  },
};

export const badRequestResponse = {
  400: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      error: { type: "string" },
    },
    description: "Bad request",
  },
};

export const unauthorizedResponse = {
  401: {
    type: "object",
    properties: {
      statusCode: { type: "number" },
      error: { type: "string" },
      message: { type: "string" },
    },
    description: "Unauthorized - Invalid or missing API key",
  },
};

/**
 * Combine common error responses
 * Use this to add all standard error responses at once
 */
export const commonErrorResponses = {
  ...rateLimitResponse,
  ...serverErrorResponse,
};

/**
 * All common responses including client errors
 */
export const allCommonResponses = {
  ...badRequestResponse,
  ...unauthorizedResponse,
  ...rateLimitResponse,
  ...serverErrorResponse,
};

