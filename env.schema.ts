export const envSchema = {
  type: "object",
  required: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"],
  properties: {
    PORT: {
      type: "number",
      default: 3000,
    },
    NODE_ENV: {
      type: "string",
      default: "production",
    },
    R2_ACCOUNT_ID: {
      type: "string",
    },
    R2_ACCESS_KEY_ID: {
      type: "string",
    },
    R2_SECRET_ACCESS_KEY: {
      type: "string",
    },
    R2_PUBLIC_BUCKET_URL: {
      type: "string",
      default: "https://media.recollect.so",
    },
    R2_MAIN_BUCKET_NAME: {
      type: "string",
      default: "recollect",
    },
  },
};

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      NODE_ENV: string;
      R2_ACCOUNT_ID: string;
      R2_ACCESS_KEY_ID: string;
      R2_SECRET_ACCESS_KEY: string;
      R2_PUBLIC_BUCKET_URL: string;
      R2_MAIN_BUCKET_NAME: string;
    };
  }
}

