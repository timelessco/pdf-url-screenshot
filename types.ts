export type PdfScreenshotRequest = {
  url: string;
};

export type PdfScreenshotResponse = {
  publicUrl?: string;
  path?: string;
  success: boolean;
  error?: string;
  details?: string;
};

