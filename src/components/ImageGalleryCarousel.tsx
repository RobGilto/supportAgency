import React, { useState, useEffect, useCallback } from 'react';
import { ImageGallery } from '@/types';
import { imageGalleryRepository, ImageSearchFilters } from '@/services/repositories/ImageGalleryRepository';

interface ImageGalleryCarouselProps {
  images?: ImageGallery[];
  caseId?: string;
  tags?: string[];
  searchFilters?: ImageSearchFilters;
  onImageSelect?: (image: ImageGallery) => void;
  onImageDelete?: (imageId: string) => void;
  className?: string;
  itemsPerPage?: number;
  showMetadata?: boolean;
}

const ImageGalleryCarousel: React.FC<ImageGalleryCarouselProps> = ({
  images: providedImages,
  caseId,
  tags,
  searchFilters,
  onImageSelect,
  onImageDelete,
  className = '',
  itemsPerPage = 6,
  showMetadata = true
}) => {
  const [images, setImages] = useState<ImageGallery[]>(providedImages || []);
  const [selectedImage, setSelectedImage] = useState<ImageGallery | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(!providedImages);
  const [error, setError] = useState<string | null>(null);

  // Load images if not provided as props
  useEffect(() => {
    if (!providedImages) {
      loadImages();
    }
  }, [providedImages, caseId, tags, searchFilters]);

  const loadImages = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (searchFilters) {
        result = await imageGalleryRepository.findImages(searchFilters);
      } else if (caseId) {
        result = await imageGalleryRepository.findByCase(caseId);
      } else if (tags && tags.length > 0) {
        result = await imageGalleryRepository.findByTags(tags);
      } else {
        result = await imageGalleryRepository.getRecent(50);
      }

      if (result.success) {
        setImages(result.data);
      } else {
        setError('Failed to load images');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = useCallback((image: ImageGallery) => {
    setSelectedImage(image);
    if (onImageSelect) {
      onImageSelect(image);
    }
  }, [onImageSelect]);

  const handleImageDelete = useCallback(async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const result = await imageGalleryRepository.deleteImage(imageId);
      if (result.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        if (selectedImage?.id === imageId) {
          setSelectedImage(null);
        }
        if (onImageDelete) {
          onImageDelete(imageId);
        }
      } else {
        setError('Failed to delete image');
      }
    } catch (err) {
      setError('Failed to delete image');
      console.error('Error deleting image:', err);
    }
  }, [selectedImage, onImageDelete]);

  const createImageUrl = (blob: Blob): string => {
    return URL.createObjectURL(blob);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Pagination
  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImages = images.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="text-gray-500">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">📸</div>
        <p>No images found</p>
        <p className="text-sm mt-1">Upload some images to get started</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        {currentImages.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            onClick={() => handleImageClick(image)}
          >
            <div className="aspect-square relative">
              <img
                src={createImageUrl(image.thumbnailBlob)}
                alt={image.filename}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image);
                    }}
                    className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="View full image"
                  >
                    👁️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDelete(image.id);
                    }}
                    className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete image"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            
            {showMetadata && (
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate" title={image.filename}>
                  {image.filename}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">
                    {formatFileSize(image.fileSize)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {image.width}×{image.height}
                  </span>
                </div>
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {image.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {image.tags.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{image.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ←
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={`px-3 py-1 rounded-lg ${
                  i === currentPage
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            →
          </button>
        </div>
      )}

      {/* Full Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold truncate">
                {selectedImage.filename}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 flex justify-center">
                <img
                  src={createImageUrl(selectedImage.webpBlob)}
                  alt={selectedImage.filename}
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Dimensions:</p>
                  <p>{selectedImage.width} × {selectedImage.height}</p>
                </div>
                <div>
                  <p className="text-gray-600">File Size:</p>
                  <p>{formatFileSize(selectedImage.fileSize)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Format:</p>
                  <p>{selectedImage.originalFormat.replace('image/', '').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created:</p>
                  <p>{formatDate(selectedImage.createdAt)}</p>
                </div>
              </div>
              
              {selectedImage.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryCarousel;