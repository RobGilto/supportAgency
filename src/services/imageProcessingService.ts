import { Result, ImageGallery } from '@/types';
import { generateUUID } from '@/utils/generators';

export interface ImageProcessingResult {
  originalFile: File;
  webpBlob: Blob;
  thumbnailBlob: Blob;
  metadata: {
    originalFormat: string;
    width: number;
    height: number;
    originalSize: number;
    webpSize: number;
    thumbnailSize: number;
    compressionRatio: number;
  };
  processingTime: number;
}

export interface ImageProcessingOptions {
  quality?: number; // 0-1, default 0.8
  thumbnailSize?: number; // pixels, default 150
  maxWidth?: number; // pixels, no limit by default
  maxHeight?: number; // pixels, no limit by default
}

export interface ImageUploadProgress {
  fileIndex: number;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  result?: ImageProcessingResult;
  error?: string;
}

export class ImageProcessingService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly DEFAULT_QUALITY = 0.8;
  private readonly DEFAULT_THUMBNAIL_SIZE = 150;

  /**
   * Validate image file before processing
   */
  validateImageFile(file: File): Result<void> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        success: false,
        error: new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
      };
    }

    // Check file type
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        success: false,
        error: new Error(`Unsupported file format: ${file.type}. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`)
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Process single image: convert to WebP and generate thumbnail
   */
  async processImage(file: File, options: ImageProcessingOptions = {}): Promise<Result<ImageProcessingResult>> {
    const startTime = performance.now();

    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.success) {
        return validation;
      }

      const {
        quality = this.DEFAULT_QUALITY,
        thumbnailSize = this.DEFAULT_THUMBNAIL_SIZE,
        maxWidth,
        maxHeight
      } = options;

      // Load image
      const image = await this.loadImageFromFile(file);
      
      // Get original dimensions
      const originalWidth = image.naturalWidth;
      const originalHeight = image.naturalHeight;

      // Calculate target dimensions
      const targetDimensions = this.calculateTargetDimensions(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight
      );

      // Create main WebP image
      const webpBlob = await this.convertToWebP(
        image,
        targetDimensions.width,
        targetDimensions.height,
        quality
      );

      // Create thumbnail
      const thumbnailDimensions = this.calculateThumbnailDimensions(
        originalWidth,
        originalHeight,
        thumbnailSize
      );

      const thumbnailBlob = await this.convertToWebP(
        image,
        thumbnailDimensions.width,
        thumbnailDimensions.height,
        quality
      );

      const processingTime = performance.now() - startTime;

      const result: ImageProcessingResult = {
        originalFile: file,
        webpBlob,
        thumbnailBlob,
        metadata: {
          originalFormat: file.type,
          width: targetDimensions.width,
          height: targetDimensions.height,
          originalSize: file.size,
          webpSize: webpBlob.size,
          thumbnailSize: thumbnailBlob.size,
          compressionRatio: file.size > 0 ? webpBlob.size / file.size : 0
        },
        processingTime
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Image processing failed')
      };
    }
  }

  /**
   * Process multiple images with progress tracking
   */
  async processMultipleImages(
    files: File[],
    options: ImageProcessingOptions = {},
    onProgress?: (progress: ImageUploadProgress[]) => void
  ): Promise<Result<ImageProcessingResult[]>> {
    const results: ImageProcessingResult[] = [];
    const progressArray: ImageUploadProgress[] = files.map((file, index) => ({
      fileIndex: index,
      fileName: file.name,
      status: 'pending',
      progress: 0
    }));

    // Initial progress callback
    if (onProgress) {
      onProgress([...progressArray]);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update progress: processing
      progressArray[i].status = 'processing';
      progressArray[i].progress = 0;
      if (onProgress) {
        onProgress([...progressArray]);
      }

      try {
        const result = await this.processImage(file, options);
        
        if (result.success) {
          results.push(result.data);
          progressArray[i].status = 'completed';
          progressArray[i].progress = 100;
          progressArray[i].result = result.data;
        } else {
          progressArray[i].status = 'error';
          progressArray[i].error = result.error.message;
        }
      } catch (error) {
        progressArray[i].status = 'error';
        progressArray[i].error = error instanceof Error ? error.message : 'Processing failed';
      }

      // Update progress
      if (onProgress) {
        onProgress([...progressArray]);
      }
    }

    return { success: true, data: results };
  }

  /**
   * Create ImageGallery object from processing result
   */
  createImageGalleryObject(result: ImageProcessingResult, caseId?: string, tags: string[] = []): ImageGallery {
    return {
      id: generateUUID(),
      filename: result.originalFile.name,
      originalFormat: result.metadata.originalFormat,
      webpBlob: result.webpBlob,
      thumbnailBlob: result.thumbnailBlob,
      width: result.metadata.width,
      height: result.metadata.height,
      fileSize: result.metadata.webpSize,
      caseId,
      createdAt: new Date(),
      tags: [...tags, 'processed'],
      annotations: []
    };
  }

  /**
   * Load image from file
   */
  private loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      image.src = objectUrl;
    });
  }

  /**
   * Convert image to WebP format
   */
  private async convertToWebP(
    image: HTMLImageElement,
    width: number,
    height: number,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(image, 0, 0, width, height);

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        },
        'image/webp',
        quality
      );
    });
  }

  /**
   * Calculate target dimensions with constraints
   */
  private calculateTargetDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Apply max width constraint
    if (maxWidth && width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }

    // Apply max height constraint
    if (maxHeight && height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = Math.round(width * ratio);
    }

    return { width, height };
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    thumbnailSize: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    if (aspectRatio > 1) {
      // Landscape
      return {
        width: thumbnailSize,
        height: Math.round(thumbnailSize / aspectRatio)
      };
    } else {
      // Portrait or square
      return {
        width: Math.round(thumbnailSize * aspectRatio),
        height: thumbnailSize
      };
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(results: ImageProcessingResult[]): {
    totalFiles: number;
    totalOriginalSize: number;
    totalWebpSize: number;
    averageCompressionRatio: number;
    averageProcessingTime: number;
  } {
    if (results.length === 0) {
      return {
        totalFiles: 0,
        totalOriginalSize: 0,
        totalWebpSize: 0,
        averageCompressionRatio: 0,
        averageProcessingTime: 0
      };
    }

    const totalOriginalSize = results.reduce((sum, r) => sum + r.metadata.originalSize, 0);
    const totalWebpSize = results.reduce((sum, r) => sum + r.metadata.webpSize, 0);
    const averageCompressionRatio = results.reduce((sum, r) => sum + r.metadata.compressionRatio, 0) / results.length;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    return {
      totalFiles: results.length,
      totalOriginalSize,
      totalWebpSize,
      averageCompressionRatio,
      averageProcessingTime
    };
  }

  /**
   * Check WebP support
   */
  isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }
}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService();