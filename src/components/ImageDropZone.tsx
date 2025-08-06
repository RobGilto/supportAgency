import React, { useCallback, useState, useRef } from 'react';
import { ImageProcessingService, ImageUploadProgress } from '@/services/imageProcessingService';
import { imageGalleryRepository } from '@/services/repositories/ImageGalleryRepository';

interface ImageDropZoneProps {
  onImagesUploaded?: (imageIds: string[]) => void;
  caseId?: string;
  tags?: string[];
  maxFiles?: number;
  className?: string;
}

const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  onImagesUploaded,
  caseId,
  tags = [],
  maxFiles = 10,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageProcessingService = new ImageProcessingService();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
    
    // Reset input value to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFiles = async (files: File[]) => {
    // Limit number of files
    const filesToProcess = files.slice(0, maxFiles);
    
    if (files.length > maxFiles) {
      setError(`Only the first ${maxFiles} images will be processed.`);
      setTimeout(() => setError(null), 5000);
    }

    setIsProcessing(true);
    setUploadProgress([]);
    setError(null);

    try {
      // Process images with progress tracking
      const result = await imageProcessingService.processMultipleImages(
        filesToProcess,
        { quality: 0.8, thumbnailSize: 150 },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (!result.success) {
        setError('Failed to process images');
        return;
      }

      // Save to image gallery
      const imageIds: string[] = [];
      const successfulResults = result.data;

      for (const processResult of successfulResults) {
        const imageGallery = imageProcessingService.createImageGalleryObject(
          processResult,
          caseId,
          tags
        );

        const saveResult = await imageGalleryRepository.createImage(imageGallery);
        if (saveResult.success) {
          imageIds.push(saveResult.data.id);
        }
      }

      // Notify parent component
      if (onImagesUploaded && imageIds.length > 0) {
        onImagesUploaded(imageIds);
      }

      // Clear progress after success
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);

    } catch (error) {
      console.error('Image processing error:', error);
      setError('An unexpected error occurred during image processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const completedCount = uploadProgress.filter(p => p.status === 'completed').length;
  const errorCount = uploadProgress.filter(p => p.status === 'error').length;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-75 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-blue-600">
              <div className="text-2xl mb-2">⚡</div>
              <p className="font-medium">Processing Images...</p>
              <p className="text-sm text-gray-600 mt-1">
                {completedCount} of {uploadProgress.length} completed
                {errorCount > 0 && `, ${errorCount} failed`}
              </p>
            </div>
            
            {/* Progress bars for each file */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadProgress.map((progress) => (
                <div key={progress.fileIndex} className="text-left">
                  <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                    <span className="truncate max-w-48">{progress.fileName}</span>
                    <span className="capitalize text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: progress.status === 'completed' ? '#dcfce7' : 
                                       progress.status === 'error' ? '#fef2f2' : 
                                       progress.status === 'processing' ? '#dbeafe' : '#f3f4f6',
                        color: progress.status === 'completed' ? '#166534' :
                               progress.status === 'error' ? '#991b1b' :
                               progress.status === 'processing' ? '#1e40af' : '#374151'
                      }}
                    >
                      {progress.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${getProgressColor(progress.status)}`}
                      style={{ 
                        width: `${progress.status === 'error' ? 100 : progress.progress}%` 
                      }}
                    />
                  </div>
                  {progress.error && (
                    <div className="text-red-600 text-xs mt-1">{progress.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`text-4xl ${isDragging ? 'animate-bounce' : ''}`}>
              📸
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Drop images here!' : 'Drop images or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPEG, PNG, GIF, WebP • Max {maxFiles} files • Up to 10MB each
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Images will be automatically converted to WebP format
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success summary */}
      {uploadProgress.length > 0 && !isProcessing && completedCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <p className="text-green-700 text-sm">
                Successfully uploaded {completedCount} image{completedCount !== 1 ? 's' : ''}
                {errorCount > 0 && `, ${errorCount} failed`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDropZone;