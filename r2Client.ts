import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	publicBucketUrl: string;
}

// Create R2 client with configuration
export function createR2Client(config: R2Config) {
	return new S3Client({
		region: "auto",
		endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		// Required for R2 compatibility
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});
}

// Helper functions for R2 operations
export function createR2Helpers(r2Client: S3Client, publicBucketUrl: string) {
	return {
		// List objects in a bucket with prefix
		async listObjects(bucket: string, prefix?: string) {
			const command = new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
			});

			try {
				const response = await r2Client.send(command);
				return { data: response.Contents ?? [], error: null };
			} catch (error) {
				return { data: null, error };
			}
		},

		// Upload object to R2
		async uploadObject(
			bucket: string,
			key: string,
			body: Buffer | Uint8Array,
			contentType?: string,
		) {
			const command = new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
			});

			try {
				await r2Client.send(command);
				return { error: null };
			} catch (error) {
				return { error };
			}
		},

		// Delete single object
		async deleteObject(bucket: string, key: string) {
			const command = new DeleteObjectCommand({
				Bucket: bucket,
				Key: key,
			});

			try {
				await r2Client.send(command);
				return { error: null };
			} catch (error) {
				return { error };
			}
		},

		// Delete multiple objects
		async deleteObjects(bucket: string, keys: string[]) {
			const command = new DeleteObjectsCommand({
				Bucket: bucket,
				Delete: {
					Objects: keys.map((key) => ({ Key: key })),
				},
			});

			try {
				const response = await r2Client.send(command);
				return { data: response.Deleted ?? [], error: null };
			} catch (error) {
				return { data: null, error };
			}
		},

		// Generate presigned URL for upload
		async createSignedUploadUrl(bucket: string, key: string, expiresIn = 3_600) {
			const command = new PutObjectCommand({
				Bucket: bucket,
				Key: key,
			});

			try {
				const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
				return { data: { signedUrl }, error: null };
			} catch (error) {
				return { data: null, error };
			}
		},

		// Generate presigned URL for download
		async createSignedDownloadUrl(
			bucket: string,
			key: string,
			expiresIn = 3_600,
		) {
			const command = new GetObjectCommand({
				Bucket: bucket,
				Key: key,
			});

			try {
				const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
				return { data: { signedUrl }, error: null };
			} catch (error) {
				return { data: null, error };
			}
		},

		// Get public URL for public buckets (permanent, no expiration)
		getPublicUrl(path: string) {
			const url = `${publicBucketUrl}/${path}`;
			return { data: { publicUrl: url }, error: null };
		},

		// Get signed URL with maximum allowed expiration (7 days)
		async getSignedUrl(bucket: string, key: string, expiresIn = 604_800) {
			// Max expiration is 7 days (604,800 seconds) for R2
			const maxExpiration = Math.min(expiresIn, 604_800);

			const command = new GetObjectCommand({
				Bucket: bucket,
				Key: key,
			});

			try {
				const signedUrl = await getSignedUrl(r2Client, command, {
					expiresIn: maxExpiration,
				});
				return { data: { signedUrl }, error: null };
			} catch (error) {
				return { data: null, error };
			}
		},
	};
}
