import { S3Client } from "@aws-sdk/client-s3";

declare global {
  var __r2: S3Client | undefined;
}

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export const r2 = globalThis.__r2 ?? createR2Client();

if (process.env.NODE_ENV !== "production") {
  globalThis.__r2 = r2;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
