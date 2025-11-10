import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import { createCanvas } from "canvas";
// @ts-ignore - Legacy build doesn't have perfect types
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { createR2Client, createR2Helpers } from "./r2Client";

const URL_PDF_CHECK_PATTERN = /^https?:\/\/.+\.pdf(\?.*)?$/i;

// Initialize Fastify
const fastify = Fastify({
  logger: true,
});

// Environment variable schema
const schema = {
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

type PdfScreenshotRequest = {
  url: string;
};

type PdfScreenshotResponse = {
  publicUrl?: string;
  path?: string;
  success: boolean;
  error?: string;
  details?: string;
};

// Root endpoint
fastify.get("/", async (request, reply) => {
  return { message: "Hello from Hetzner Node server fastify" };
});

// PDF Screenshot endpoint
fastify.post<{
  Body: PdfScreenshotRequest;
  Reply: PdfScreenshotResponse;
}>("/upload/pdf-screenshot", async (request, reply) => {
  try {
    // Initialize R2 client with config
    const r2Client = createR2Client({
      accountId: fastify.config.R2_ACCOUNT_ID,
      accessKeyId: fastify.config.R2_ACCESS_KEY_ID,
      secretAccessKey: fastify.config.R2_SECRET_ACCESS_KEY,
      publicBucketUrl: fastify.config.R2_PUBLIC_BUCKET_URL,
    });
    const r2Helpers = createR2Helpers(r2Client, fastify.config.R2_PUBLIC_BUCKET_URL);
    const R2_MAIN_BUCKET_NAME = fastify.config.R2_MAIN_BUCKET_NAME;

    const { url } = request.body;

    // if (!url || !URL_PDF_CHECK_PATTERN.test(url)) {
    //   return reply.status(400).send({
    //     success: false,
    //     error: "Invalid or missing PDF url",
    //   });
    // }

    // Fetch PDF bytes
    let pdfResponse;
    try {
      console.log(`[Line 50] Fetching PDF from URL: ${url}`);
      pdfResponse = await fetch(url);
    } catch (error) {
      console.error(`[Line 50] FAILED at fetch(url)`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to fetch PDF from url",
        details: `Fetch failed at line 50: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    if (!pdfResponse.ok) {
      return reply.status(400).send({
        success: false,
        error: "Failed to fetch PDF from url",
      });
    }

    let arrayBuffer;
    try {
      console.log(`[Line 57] Converting PDF response to arrayBuffer`);
      arrayBuffer = await pdfResponse.arrayBuffer();
    } catch (error) {
      console.error(`[Line 57] FAILED at pdfResponse.arrayBuffer()`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to read PDF data",
        details: `ArrayBuffer conversion failed at line 57: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    const pdfData = new Uint8Array(arrayBuffer);


    // Render first page using pdfjs + node-canvas
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      disableAutoFetch: true,
      isEvalSupported: false,
    });
    
    let pdf;
    try {
      console.log(`[Line 67] Loading PDF document`);
      pdf = await loadingTask.promise;
    } catch (error) {
      console.error(`[Line 67] FAILED at loadingTask.promise`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to load PDF document",
        details: `PDF loading failed at line 67: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    let firstPage;
    try {
      console.log(`[Line 68] Getting first page of PDF`);
      firstPage = await pdf.getPage(1);
      console.log('iiiiiiiiiii~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', firstPage)
    } catch (error) {
      console.error(`[Line 68] FAILED at pdf.getPage(1)`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to get first page of PDF",
        details: `Get page failed at line 68: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const scale = 1.5;
    const viewport = firstPage.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    
    try {
      console.log(`[Line 74] Rendering PDF page to canvas`);
      // await firstPage.render({ canvasContext: context as any, viewport, canvas: canvas as any }).promise;
      await firstPage.render({ canvasContext: context as any, viewport }).promise;
    } catch (error) {
      console.error(`[Line 74] FAILED at firstPage.render().promise`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to render PDF page",
        details: `PDF rendering failed at line 74: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const imageBuffer = canvas.toBuffer("image/png");

    // Derive a stable file name
    const decodedName = decodeURIComponent(
      url?.split("/").pop()?.split("?")[0]?.split("#")[0] ?? "file.pdf"
    );
    const baseName = decodedName.replace(/\.pdf$/iu, "");
    const thumbnailFileName = `thumb-${baseName}.png`;
    const key = `test/${thumbnailFileName}`;

    // Upload to R2 directly from server
    let uploadResult;
    try {
      console.log(`[Line 91] Uploading thumbnail to R2: ${key}`);
      uploadResult = await r2Helpers.uploadObject(
        R2_MAIN_BUCKET_NAME,
        key,
        imageBuffer,
        "image/png"
      );
    } catch (error) {
      console.error(`[Line 91] FAILED at r2Helpers.uploadObject()`, error);
      return reply.status(500).send({
        success: false,
        error: "Failed to upload thumbnail to R2",
        details: `R2 upload failed at line 91: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    if (uploadResult.error) {
      return reply.status(500).send({
        success: false,
        error: "Failed to upload thumbnail to R2",
      });
    }

    const { data } = r2Helpers.getPublicUrl(key);
    return reply.status(200).send({
      success: true,
      path: key,
      publicUrl: data.publicUrl,
    });
  } catch (error) {
    console.error("PDF Screenshot Error (uncaught):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    fastify.log.error({ error }, "pdf-screenshot api error");
    return reply.status(500).send({
      success: false,
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start server
const start = async () => {
  try {
    // Register environment variables plugin
    await fastify.register(fastifyEnv, {
      dotenv: true,
      schema,
    });

    console.log(`[Starting] Fastify server on port ${fastify.config.PORT}`);
    console.log(`[Config] R2 Account ID: ${fastify.config.R2_ACCOUNT_ID}`);
    console.log(`[Config] R2 Bucket: ${fastify.config.R2_MAIN_BUCKET_NAME}`);

    await fastify.listen({ port: fastify.config.PORT, host: "0.0.0.0" });
    console.log(`Server running at http://localhost:${fastify.config.PORT}`);
  } catch (err) {
    console.error(`[FAILED] at fastify.listen()`, err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
