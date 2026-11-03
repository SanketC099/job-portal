import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Response } from "express";
import { Readable } from "node:stream";

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const isProduction = process.env.NODE_ENV === "production";
const hasS3Config = Boolean(bucket && endpoint && accessKeyId && secretAccessKey);

let client: S3Client | undefined;
function getClient(): S3Client {
  if (!hasS3Config) throw new Error("Resume object storage is not configured.");
  client ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });
  return client;
}

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return [".pdf", ".doc", ".docx", ".txt"].includes(ext) ? ext : ".bin";
}

export async function saveResume(userId: number, file: Express.Multer.File) {
  const key = `resumes/${userId}/${randomUUID()}${safeExtension(file.originalname)}`;

  if (hasS3Config) {
    await getClient().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
      ContentLength: file.size,
      ServerSideEncryption: "AES256",
    }));
    return { resumeKey: key, resumePath: null };
  }

  if (isProduction) throw new Error("Resume object storage is not configured.");
  const localFile = path.join(process.cwd(), "uploads", "resumes", path.basename(key));
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, file.buffer, { flag: "wx" });
  return { resumeKey: null, resumePath: `/uploads/resumes/${path.basename(localFile)}` };
}

export async function streamResume(key: string, fileName: string, res: Response) {
  const result = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error("Resume object was empty.");
  res.setHeader("Content-Type", result.ContentType || "application/octet-stream");
  if (result.ContentLength) res.setHeader("Content-Length", String(result.ContentLength));
  res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/[\r\n"\\]/g, "_")}"`);
  (result.Body as Readable).pipe(res);
}

export const resumeStorageConfigured = hasS3Config;
