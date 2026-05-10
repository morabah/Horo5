/**
 * Upload files to Shopify Admin via staged uploads.
 * Downloads remote images, stages them, creates Shopify files,
 * and maps source URLs to Shopify file IDs.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

interface ImageUploadJob {
  sourceUrl: string;
  alt?: string;
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string; size: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn(`Failed to download image: ${url} — HTTP ${response.status}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer, mimeType, size: buffer.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Failed to download image: ${url} — ${message}`);
    return null;
  }
}

async function uploadToStaging(
  target: {
    url: string;
    parameters: Array<{ name: string; value: string }>;
  },
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const formData = new FormData();
  for (const param of target.parameters) {
    formData.append(param.name, param.value);
  }
  // Append the file last for S3-compatibility
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append('file', blob);

  try {
    const response = await fetch(target.url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      logger.warn(`Staging upload failed: HTTP ${response.status} — ${text.slice(0, 200)}`);
      return null;
    }
    // Successful staged upload returns the resource URL in the Location header or the body
    const resourceUrl = response.headers.get('Location') || target.url;
    return resourceUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Staging upload error: ${message}`);
    return null;
  }
}

export async function uploadFiles(
  client: ShopifyAdminClient,
  images: ImageUploadJob[],
  idMap: IdMap,
  dryRun: boolean
): Promise<{ uploaded: Array<{ sourceUrl: string; fileId: string }>; skipped: string[]; errors: string[] }> {
  const uploaded: Array<{ sourceUrl: string; fileId: string }> = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  if (images.length === 0) {
    return { uploaded, skipped, errors };
  }

  if (dryRun) {
    for (const img of images) {
      logger.dryRun(`Would upload image: ${img.sourceUrl}`);
      uploaded.push({ sourceUrl: img.sourceUrl, fileId: 'dry-run' });
    }
    return { uploaded, skipped, errors };
  }

  // Check cache in idMap
  const uncachedImages: ImageUploadJob[] = [];
  for (const img of images) {
    if (idMap.files[img.sourceUrl]) {
      uploaded.push({ sourceUrl: img.sourceUrl, fileId: idMap.files[img.sourceUrl] });
      skipped.push(img.sourceUrl);
      continue;
    }
    uncachedImages.push(img);
  }

  if (uncachedImages.length === 0) {
    return { uploaded, skipped, errors };
  }

  // Download images first
  const downloaded = await Promise.all(
    uncachedImages.map(async (img) => {
      const data = await downloadImage(img.sourceUrl);
      return { job: img, data };
    })
  );

  const readyForStaging = downloaded
    .filter((d): d is { job: ImageUploadJob; data: { buffer: Buffer; mimeType: string; size: number } } => d.data !== null)
    .map((d) => ({ sourceUrl: d.job.sourceUrl, alt: d.job.alt ?? '', ...d.data }));

  const failedDownloads = downloaded.filter((d) => d.data === null).map((d) => d.job.sourceUrl);
  errors.push(...failedDownloads.map((url) => `${url}: download failed`));

  if (readyForStaging.length === 0) {
    return { uploaded, skipped, errors };
  }

  // Create staged upload targets
  logger.info(`Creating staged upload targets for ${readyForStaging.length} images`);
  const stagedFiles = readyForStaging.map((img) => ({
    filename: img.sourceUrl.split('/').pop() || 'image.jpg',
    mimeType: img.mimeType,
    size: img.size,
    resource: 'IMAGE',
  }));

  let targets: Array<{ url: string; resourceUrl: string | null; parameters: Array<{ name: string; value: string }> }> = [];
  try {
    targets = await client.createStagedUploads(stagedFiles);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(...readyForStaging.map((img) => `${img.sourceUrl}: stagedUploadsCreate failed — ${message}`));
    return { uploaded, skipped, errors };
  }

  // Upload to staging URLs
  const stagedUrls: Array<{ sourceUrl: string; resourceUrl: string; alt: string; mimeType: string }> = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const img = readyForStaging[i];
    if (!target) {
      errors.push(`${img.sourceUrl}: no staging target returned`);
      continue;
    }
    const resourceUrl = await uploadToStaging(target, img.buffer, img.mimeType);
    if (resourceUrl) {
      stagedUrls.push({ sourceUrl: img.sourceUrl, resourceUrl, alt: img.alt, mimeType: img.mimeType });
    } else {
      errors.push(`${img.sourceUrl}: staging upload failed`);
    }
  }

  if (stagedUrls.length === 0) {
    return { uploaded, skipped, errors };
  }

  // Create Shopify files from staged uploads
  logger.info(`Creating Shopify files for ${stagedUrls.length} images`);
  const fileInputs = stagedUrls.map((s) => ({
    alt: s.alt,
    contentType: s.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE',
    originalSource: s.resourceUrl,
  }));

  let createdFiles: Array<{ id: string; alt: string }> = [];
  try {
    createdFiles = await client.createFiles(fileInputs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(...stagedUrls.map((s) => `${s.sourceUrl}: fileCreate failed — ${message}`));
    return { uploaded, skipped, errors };
  }

  for (let i = 0; i < createdFiles.length; i++) {
    const file = createdFiles[i];
    const source = stagedUrls[i];
    if (file && source) {
      idMap.files[source.sourceUrl] = file.id;
      uploaded.push({ sourceUrl: source.sourceUrl, fileId: file.id });
      logger.success(`Uploaded image: ${source.sourceUrl} → ${file.id}`);
    }
  }

  return { uploaded, skipped, errors };
}
