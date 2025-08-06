import { BaseRepository } from './base';
import { ImageGallery, Result, DatabaseError, ValidationError } from '@/types';
import { db } from '../database';
import { generateUUID } from '@/utils/generators';

export interface ImageSearchFilters {
  caseId?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  format?: string;
  minSize?: number;
  maxSize?: number;
}

export interface ImageGalleryStats {
  totalImages: number;
  totalSize: number;
  formatDistribution: Record<string, number>;
  averageFileSize: number;
  averageCompressionRatio: number;
}

export class ImageGalleryRepository extends BaseRepository<ImageGallery> {
  constructor() {
    super(db.imageGallery);
  }

  /**
   * Validate ImageGallery entity
   */
  protected async validateEntity(entity: ImageGallery): Promise<void> {
    if (!entity.filename || entity.filename.trim().length === 0) {
      throw new ValidationError('Filename is required', 'filename');
    }
    if (!entity.webpBlob || entity.webpBlob.size === 0) {
      throw new ValidationError('WebP blob is required', 'webpBlob');
    }
    if (!entity.thumbnailBlob || entity.thumbnailBlob.size === 0) {
      throw new ValidationError('Thumbnail blob is required', 'thumbnailBlob');
    }
    if (entity.width <= 0 || entity.height <= 0) {
      throw new ValidationError('Valid dimensions are required', 'dimensions');
    }
  }

  /**
   * Create new image gallery entry
   */
  async createImage(imageData: Omit<ImageGallery, 'id' | 'createdAt'>): Promise<Result<ImageGallery>> {
    try {
      const image: ImageGallery = {
        ...imageData,
        id: generateUUID(),
        createdAt: new Date()
      };

      await this.table.add(image);
      return { success: true, data: image };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to create image gallery entry')
      };
    }
  }

  /**
   * Find images with filters
   */
  async findImages(filters: ImageSearchFilters = {}): Promise<Result<ImageGallery[]>> {
    try {
      let query = this.table.toCollection();

      // Apply case ID filter
      if (filters.caseId) {
        query = this.table.where('caseId').equals(filters.caseId);
      }

      // Apply date range filter
      if (filters.dateRange) {
        query = query.filter(image => 
          image.createdAt >= filters.dateRange!.from && 
          image.createdAt <= filters.dateRange!.to
        );
      }

      // Apply format filter
      if (filters.format) {
        query = query.filter(image => image.originalFormat === filters.format);
      }

      // Apply size filters
      if (filters.minSize || filters.maxSize) {
        query = query.filter(image => {
          if (filters.minSize && image.fileSize < filters.minSize) return false;
          if (filters.maxSize && image.fileSize > filters.maxSize) return false;
          return true;
        });
      }

      // Apply tags filter
      if (filters.tags && filters.tags.length > 0) {
        query = query.filter(image => 
          filters.tags!.some(tag => image.tags.includes(tag))
        );
      }

      const images = await query.reverse().sortBy('createdAt');
      return { success: true, data: images };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to find images')
      };
    }
  }

  /**
   * Find images by case ID
   */
  async findByCase(caseId: string): Promise<Result<ImageGallery[]>> {
    return this.findImages({ caseId });
  }

  /**
   * Find images by tags
   */
  async findByTags(tags: string[]): Promise<Result<ImageGallery[]>> {
    return this.findImages({ tags });
  }

  /**
   * Get recent images
   */
  async getRecent(limit: number = 20): Promise<Result<ImageGallery[]>> {
    try {
      const images = await this.table
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray();

      return { success: true, data: images };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to get recent images')
      };
    }
  }

  /**
   * Add tags to image
   */
  async addTags(imageId: string, tags: string[]): Promise<Result<void>> {
    try {
      const image = await this.table.get(imageId);
      if (!image) {
        return { success: false, error: new Error('Image not found') };
      }

      const uniqueTags = Array.from(new Set([...image.tags, ...tags]));
      await this.table.update(imageId, { tags: uniqueTags });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to add tags')
      };
    }
  }

  /**
   * Remove tags from image
   */
  async removeTags(imageId: string, tags: string[]): Promise<Result<void>> {
    try {
      const image = await this.table.get(imageId);
      if (!image) {
        return { success: false, error: new Error('Image not found') };
      }

      const updatedTags = image.tags.filter(tag => !tags.includes(tag));
      await this.table.update(imageId, { tags: updatedTags });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to remove tags')
      };
    }
  }

  /**
   * Associate image with case
   */
  async associateWithCase(imageId: string, caseId: string): Promise<Result<void>> {
    try {
      await this.table.update(imageId, { caseId });
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to associate image with case')
      };
    }
  }

  /**
   * Remove case association
   */
  async removeCaseAssociation(imageId: string): Promise<Result<void>> {
    try {
      await this.table.update(imageId, { caseId: undefined });
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to remove case association')
      };
    }
  }

  /**
   * Update image annotations
   */
  async updateAnnotations(imageId: string, annotations: ImageGallery['annotations']): Promise<Result<void>> {
    try {
      await this.table.update(imageId, { annotations });
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to update annotations')
      };
    }
  }

  /**
   * Get image statistics
   */
  async getStatistics(): Promise<Result<ImageGalleryStats>> {
    try {
      const images = await this.table.toArray();

      if (images.length === 0) {
        return {
          success: true,
          data: {
            totalImages: 0,
            totalSize: 0,
            formatDistribution: {},
            averageFileSize: 0,
            averageCompressionRatio: 0
          }
        };
      }

      const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);
      const formatDistribution = images.reduce((acc, img) => {
        acc[img.originalFormat] = (acc[img.originalFormat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average compression ratio (if we have original sizes)
      // For now, we'll estimate based on WebP typically being 25-35% smaller
      const estimatedCompressionRatio = 0.7; // Assume 30% compression

      const stats: ImageGalleryStats = {
        totalImages: images.length,
        totalSize,
        formatDistribution,
        averageFileSize: totalSize / images.length,
        averageCompressionRatio: estimatedCompressionRatio
      };

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to get statistics')
      };
    }
  }

  /**
   * Search images by filename or tags
   */
  async search(query: string): Promise<Result<ImageGallery[]>> {
    try {
      const searchQuery = query.toLowerCase();
      
      const images = await this.table
        .filter(image => {
          // Search in filename
          if (image.filename.toLowerCase().includes(searchQuery)) {
            return true;
          }
          
          // Search in tags
          if (image.tags.some(tag => tag.toLowerCase().includes(searchQuery))) {
            return true;
          }
          
          return false;
        })
        .reverse()
        .sortBy('createdAt');

      return { success: true, data: images };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to search images')
      };
    }
  }

  /**
   * Get storage usage breakdown
   */
  async getStorageUsage(): Promise<Result<{
    totalImages: number;
    totalSize: number;
    sizeByFormat: Record<string, { count: number; size: number }>;
    sizeByMonth: Record<string, { count: number; size: number }>;
  }>> {
    try {
      const images = await this.table.toArray();
      
      const sizeByFormat = images.reduce((acc, img) => {
        const format = img.originalFormat;
        if (!acc[format]) {
          acc[format] = { count: 0, size: 0 };
        }
        acc[format].count++;
        acc[format].size += img.fileSize;
        return acc;
      }, {} as Record<string, { count: number; size: number }>);

      const sizeByMonth = images.reduce((acc, img) => {
        const month = img.createdAt.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { count: 0, size: 0 };
        }
        acc[month].count++;
        acc[month].size += img.fileSize;
        return acc;
      }, {} as Record<string, { count: number; size: number }>);

      const result = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + img.fileSize, 0),
        sizeByFormat,
        sizeByMonth
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to get storage usage')
      };
    }
  }

  /**
   * Delete image and clean up blobs (override base implementation)
   */
  async deleteImage(id: string): Promise<Result<void>> {
    try {
      const image = await this.table.get(id);
      if (!image) {
        return { success: false, error: new DatabaseError('Image not found') };
      }

      // Clean up blob URLs if they exist as object URLs
      // Note: In a real implementation, you might want to revoke object URLs
      // But since these are stored as Blob objects in IndexedDB, no cleanup needed

      await this.table.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to delete image')
      };
    }
  }

  /**
   * Bulk delete images with detailed results
   */
  async bulkDeleteImages(ids: string[]): Promise<Result<{ deleted: number; errors: string[] }>> {
    try {
      const errors: string[] = [];
      let deleted = 0;

      for (const id of ids) {
        const deleteResult = await this.deleteImage(id);
        if (deleteResult.success) {
          deleted++;
        } else {
          errors.push(`Failed to delete ${id}: ${deleteResult.error.message}`);
        }
      }

      return {
        success: true,
        data: { deleted, errors }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? new DatabaseError(error.message) : new DatabaseError('Failed to bulk delete images')
      };
    }
  }
}

// Export singleton instance
export const imageGalleryRepository = new ImageGalleryRepository();