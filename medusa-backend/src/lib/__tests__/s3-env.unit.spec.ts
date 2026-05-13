/**
 * @jest-environment node
 */

import { isSafePublicS3FileKey, resolveS3ConfigFromEnv, storeMediaPublicPath } from "../s3-env"

describe("storeMediaPublicPath", () => {
  it("returns the constant store-media path", () => {
    expect(storeMediaPublicPath()).toBe("/store-media")
  })
})

describe("isSafePublicS3FileKey", () => {
  it("accepts safe alphanumeric keys", () => {
    expect(isSafePublicS3FileKey("image.jpg")).toBe(true)
    expect(isSafePublicS3FileKey("file_name_v2.png")).toBe(true)
    expect(isSafePublicS3FileKey("my file (1).jpg")).toBe(true)
  })

  it("rejects empty keys", () => {
    expect(isSafePublicS3FileKey("")).toBe(false)
    expect(isSafePublicS3FileKey(null as any)).toBe(false)
  })

  it("rejects keys with path traversal", () => {
    expect(isSafePublicS3FileKey("../secret.txt")).toBe(false)
    expect(isSafePublicS3FileKey("folder/file.jpg")).toBe(false)
    expect(isSafePublicS3FileKey("folder\\file.jpg")).toBe(false)
  })

  it("rejects overly long keys", () => {
    expect(isSafePublicS3FileKey("a".repeat(513))).toBe(false)
  })

  it("rejects keys with special characters", () => {
    expect(isSafePublicS3FileKey("file;drop table.jpg")).toBe(false)
    expect(isSafePublicS3FileKey("file<script>.jpg")).toBe(false)
  })
})

describe("resolveS3ConfigFromEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.S3_BUCKET
    delete process.env.S3_ACCESS_KEY_ID
    delete process.env.S3_SECRET_ACCESS_KEY
    delete process.env.S3_REGION
    delete process.env.S3_ENDPOINT
    delete process.env.S3_FILE_URL
    delete process.env.MEDUSA_BACKEND_URL
    delete process.env.S3_USE_STORE_MEDIA_PROXY
    delete process.env.S3_FORCE_PATH_STYLE
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns null when required vars missing", () => {
    expect(resolveS3ConfigFromEnv()).toBeNull()
  })

  it("resolves config from standard env vars", () => {
    process.env.S3_BUCKET = "my-bucket"
    process.env.S3_ACCESS_KEY_ID = "key123"
    process.env.S3_SECRET_ACCESS_KEY = "secret456"
    process.env.S3_REGION = "us-east-1"
    process.env.S3_ENDPOINT = "https://s3.example.com"
    process.env.S3_FILE_URL = "https://cdn.example.com"

    const config = resolveS3ConfigFromEnv()
    expect(config).not.toBeNull()
    expect(config!.bucket).toBe("my-bucket")
    expect(config!.accessKeyId).toBe("key123")
    expect(config!.secretAccessKey).toBe("secret456")
    expect(config!.region).toBe("us-east-1")
    expect(config!.endpoint).toBe("https://s3.example.com")
    expect(config!.fileUrl).toBe("https://cdn.example.com")
    expect(config!.forcePathStyle).toBe(false)
  })

  it("reads AWS-prefixed fallback env vars", () => {
    process.env.AWS_S3_BUCKET_NAME = "aws-bucket"
    process.env.AWS_ACCESS_KEY_ID = "aws-key"
    process.env.AWS_SECRET_ACCESS_KEY = "aws-secret"
    process.env.AWS_DEFAULT_REGION = "eu-west-1"
    process.env.AWS_ENDPOINT_URL = "https://s3.amazonaws.com"
    process.env.S3_FILE_URL = "https://files.example.com"

    const config = resolveS3ConfigFromEnv()
    expect(config!.bucket).toBe("aws-bucket")
    expect(config!.region).toBe("eu-west-1")
  })

  it("defaults region to 'auto' when missing", () => {
    process.env.S3_BUCKET = "b"
    process.env.S3_ACCESS_KEY_ID = "k"
    process.env.S3_SECRET_ACCESS_KEY = "s"
    process.env.S3_FILE_URL = "https://cdn.example.com"

    const config = resolveS3ConfigFromEnv()
    expect(config!.region).toBe("auto")
  })

  it("uses proxy path when S3_USE_STORE_MEDIA_PROXY is true", () => {
    process.env.S3_BUCKET = "b"
    process.env.S3_ACCESS_KEY_ID = "k"
    process.env.S3_SECRET_ACCESS_KEY = "s"
    process.env.MEDUSA_BACKEND_URL = "https://api.horo.local/"
    process.env.S3_USE_STORE_MEDIA_PROXY = "true"

    const config = resolveS3ConfigFromEnv()
    expect(config!.fileUrl).toBe("https://api.horo.local/store-media")
  })

  it("derives virtual-host fileUrl from endpoint when no explicit URL", () => {
    process.env.S3_BUCKET = "my-bucket"
    process.env.S3_ACCESS_KEY_ID = "k"
    process.env.S3_SECRET_ACCESS_KEY = "s"
    process.env.S3_ENDPOINT = "https://s3.example.com"

    const config = resolveS3ConfigFromEnv()
    expect(config!.fileUrl).toBe("https://my-bucket.s3.example.com")
  })

  it("respects S3_FORCE_PATH_STYLE", () => {
    process.env.S3_BUCKET = "b"
    process.env.S3_ACCESS_KEY_ID = "k"
    process.env.S3_SECRET_ACCESS_KEY = "s"
    process.env.S3_FILE_URL = "https://cdn.example.com"
    process.env.S3_FORCE_PATH_STYLE = "true"

    const config = resolveS3ConfigFromEnv()
    expect(config!.forcePathStyle).toBe(true)
  })
})
