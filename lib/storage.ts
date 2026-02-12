/**
 * Storage abstraction layer for image uploads
 * Supports Vercel Blob (production) and local filesystem (development)
 */

export interface StorageProvider {
  uploadImage(file: File | Buffer, filename: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }>;
  deleteImage(url: string): Promise<void>;
  getImageUrl(url: string): string;
}

/**
 * Vercel Blob storage implementation
 */
class VercelBlobStorage implements StorageProvider {
  async uploadImage(file: File | Buffer, filename: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    const { put } = await import('@vercel/blob');

    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
    const buffer = Buffer.isBuffer(arrayBuffer) ? arrayBuffer : Buffer.from(arrayBuffer as ArrayBuffer);
    const size = buffer.byteLength;

    const blob = await put(filename, buffer, {
      access: 'public',
    });

    return {
      url: blob.url,
      filename: blob.pathname,
      size,
    };
  }

  async deleteImage(url: string): Promise<void> {
    const { del } = await import('@vercel/blob');
    await del(url);
  }

  getImageUrl(url: string): string {
    return url;
  }
}

/**
 * Local filesystem storage implementation (fallback for development)
 */
class LocalFileStorage implements StorageProvider {
  async uploadImage(file: File | Buffer, filename: string): Promise<{
    url: string;
    filename: string;
    size: number;
  }> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const size = buffer.byteLength;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      size,
    };
  }

  async deleteImage(url: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Extract filename from URL like "/uploads/1234567890.jpg"
    const filename = url.split('/').pop();
    if (!filename) return;

    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }
  }

  getImageUrl(url: string): string {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

/**
 * Factory function to create the appropriate storage provider
 * - Production: Vercel Blob
 * - Development with BLOB_READ_WRITE_TOKEN: Vercel Blob
 * - Development without token: Local filesystem
 */
export function createStorageProvider(): StorageProvider {
  const isVercel = !!process.env.VERCEL;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (isVercel || hasBlobToken) {
    console.log('[Storage] Using Vercel Blob storage');
    return new VercelBlobStorage();
  }

  console.log('[Storage] Using local filesystem storage');
  return new LocalFileStorage();
}

// Export singleton instance
export const storage = createStorageProvider();
