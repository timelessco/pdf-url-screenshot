import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { createCanvas } from "canvas";
// @ts-ignore - Legacy build doesn't have perfect types
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { createR2Client, createR2Helpers } from "../../r2Client";
import { PdfScreenshotRequest, PdfScreenshotResponse } from "../../types";
import { pdfEndpointRateLimitConfig } from "../../rate-limit.config";
import { badRequestResponse, rateLimitResponse, serverErrorResponse, unauthorizedResponse } from "../../schemas/common-responses";

const pdfScreenshotRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: PdfScreenshotRequest;
    Reply: PdfScreenshotResponse;
  }>("/upload/pdf-screenshot", {
    onRequest: fastify.verifyBearerAuth,
    config: {
      rateLimit: pdfEndpointRateLimitConfig,
    },
    schema: {
      description: "Generate a thumbnail image from a PDF and upload to R2 storage (Rate limited: 10 requests per hour)",
      tags: ["upload"],
      body: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            description: "URL of the PDF file to process",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            path: {
              type: "string",
              description: "R2 storage path of the thumbnail",
            },
            publicUrl: {
              type: "string",
              description: "Public URL to access the thumbnail",
            },
          },
        },
        ...badRequestResponse,    // ✨ Reusable!
        ...unauthorizedResponse,  // ✨ Reusable!
        ...rateLimitResponse,     // ✨ Reusable!
        ...serverErrorResponse,   // ✨ Reusable!
      },
    },
    handler: async (request, reply) => {
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
    },
  });
};

export default pdfScreenshotRoute;

