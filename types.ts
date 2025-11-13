export type PdfScreenshotRequest = {
  url: string;
  userId: string;
};

export type PdfScreenshotResponse = {
  publicUrl?: string;
  path?: string;
  success: boolean;
  error?: string;
  details?: string;
};

