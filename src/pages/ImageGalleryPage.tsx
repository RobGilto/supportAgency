import React, { useState, useCallback, useEffect } from 'react';
import { ImageDropZone, ImageGalleryCarousel, PasteArea } from '@/components';
import { imageGalleryRepository, ImageSearchFilters, ImageGalleryStats } from '@/services/repositories/ImageGalleryRepository';
import { PasteEvent, PasteAction } from '@/types';
import { ImageProcessingService } from '@/services/imageProcessingService';
import { usePaste } from '@/hooks/usePaste';

const ImageGalleryPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<ImageGalleryStats | null>(null);
  const [searchFilters, setSearchFilters] = useState<ImageSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const [pasteMessage, setPasteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const imageProcessingService = new ImageProcessingService();

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    const result = await imageGalleryRepository.getStatistics();
    if (result.success) {
      setStats(result.data);
    }
  };

  const handleImagesUploaded = useCallback((imageIds: string[]) => {
    console.log('Images uploaded:', imageIds);
    setRefreshKey(prev => prev + 1); // Force refresh of gallery and stats
  }, []);

  const handleImageDelete = useCallback((imageId: string) => {
    console.log('Image deleted:', imageId);
    setRefreshKey(prev => prev + 1); // Force refresh of gallery and stats
  }, []);

  const handleSearch = useCallback(() => {
    const filters: ImageSearchFilters = {};
    
    if (selectedFormat) {
      filters.format = selectedFormat;
    }
    
    setSearchFilters(filters);
  }, [selectedFormat]);

  const clearFilters = useCallback(() => {
    setSelectedFormat('');
    setSearchQuery('');
    setSearchFilters({});
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handlePasteDetected = useCallback(async (pasteEvent: PasteEvent) => {
    console.log('Gallery handlePasteDetected called:', {
      contentType: pasteEvent.contentType,
      contentLength: pasteEvent.content.length,
      startsWithDataImage: pasteEvent.content.startsWith('data:image/')
    });
    
    // Check if it's an image paste
    if (pasteEvent.contentType === 'image' && pasteEvent.content.startsWith('data:image/')) {
      console.log('Processing image paste...');
      setIsProcessingPaste(true);
      setPasteMessage(null);
      
      try {
        // Convert data URL to blob
        const response = await fetch(pasteEvent.content);
        const blob = await response.blob();
        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
        
        // Process the image
        const result = await imageProcessingService.processImage(
          file,
          { quality: 0.8, thumbnailSize: 150 }
        );
        
        if (result.success) {
          // Create image gallery object
          const imageGallery = imageProcessingService.createImageGalleryObject(
            result.data,
            undefined, // No case ID
            ['clipboard', 'pasted'] // Tags
          );
          
          // Save to gallery
          const saveResult = await imageGalleryRepository.createImage(imageGallery);
          
          if (saveResult.success) {
            setPasteMessage({ type: 'success', text: 'Image pasted successfully!' });
            setRefreshKey(prev => prev + 1); // Refresh gallery
            // Stats will refresh due to refreshKey change
          } else {
            setPasteMessage({ type: 'error', text: 'Failed to save image to gallery' });
          }
        } else {
          setPasteMessage({ type: 'error', text: 'Failed to process pasted image' });
        }
      } catch (error) {
        console.error('Error processing pasted image:', error);
        setPasteMessage({ type: 'error', text: 'Error processing pasted image' });
      } finally {
        setIsProcessingPaste(false);
      }
    }
  }, []);

  const handlePasteAction = useCallback(async (action: PasteAction, _pasteEvent: PasteEvent) => {
    if (action.type === 'process_image') {
      // The image processing is already handled in handlePasteDetected
      // This is just for the action UI feedback
    }
  }, []);

  // Page-wide paste hook for seamless image pasting
  const { isSupported: pasteSupported, isReady: pasteReady } = usePaste({
    enabled: true,
    onPaste: handlePasteDetected,
    onError: (error) => {
      console.error('Page-wide paste error:', error);
      setPasteMessage({ type: 'error', text: 'Failed to process pasted content' });
    }
  });

  // Mark page as paste-enabled for page-wide paste detection
  useEffect(() => {
    if (pasteReady) {
      document.body.setAttribute('data-paste-page', 'gallery');
      console.log('Gallery page marked as paste-enabled, pasteReady:', pasteReady);
    } else {
      console.log('Paste not ready yet, pasteSupported:', pasteSupported);
    }
    
    return () => {
      document.body.removeAttribute('data-paste-page');
      console.log('Gallery page unmarked for paste');
    };
  }, [pasteReady, pasteSupported]);

  // Clear paste message after timeout
  useEffect(() => {
    if (pasteMessage) {
      const timer = setTimeout(() => {
        setPasteMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pasteMessage]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Image Gallery</h1>
        <p className="text-gray-600 mt-1">
          Upload, view, and manage images with WebP conversion
          {pasteReady && (
            <span className="ml-2 text-green-600 font-medium">
              📋 Paste Ready - Press Ctrl+V anywhere on this page
            </span>
          )}
          {pasteSupported && !pasteReady && (
            <span className="ml-2 text-yellow-600 font-medium">
              📋 Clipboard access needed for paste
            </span>
          )}
        </p>
        
        {/* Debug/Manual Paste Button */}
        {pasteReady && (
          <div className="mt-2">
            <button
              onClick={async () => {
                try {
                  console.log('Manual paste button clicked');
                  const text = await navigator.clipboard.readText();
                  console.log('Clipboard text:', text.substring(0, 100));
                  
                  // Try to read image from clipboard
                  if ('read' in navigator.clipboard) {
                    const clipboardItems = await (navigator.clipboard as any).read();
                    console.log('Clipboard items:', clipboardItems);
                    for (const clipboardItem of clipboardItems) {
                      for (const type of clipboardItem.types) {
                        console.log('Clipboard type:', type);
                        if (type.startsWith('image/')) {
                          const blob = await clipboardItem.getType(type);
                          console.log('Image blob:', blob.size, 'bytes, type:', blob.type);
                          
                          // Convert blob to data URL
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = reader.result as string;
                            console.log('Data URL length:', dataUrl.length);
                            // Simulate paste event
                            handlePasteDetected({
                              id: 'manual-paste',
                              content: dataUrl,
                              contentType: 'image',
                              timestamp: new Date(),
                              source: 'clipboard',
                              confidence: 1.0,
                              suggestedActions: [],
                              metadata: {}
                            });
                          };
                          reader.readAsDataURL(blob);
                          return;
                        }
                      }
                    }
                  }
                  
                  setPasteMessage({ type: 'error', text: 'No image found in clipboard' });
                } catch (error) {
                  console.error('Manual paste error:', error);
                  setPasteMessage({ type: 'error', text: 'Failed to access clipboard: ' + (error as Error).message });
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              🧪 Test Manual Paste from Clipboard
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && stats.totalImages > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalImages}</div>
            <div className="text-sm text-gray-600">Total Images</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{formatFileSize(stats.averageFileSize)}</div>
            <div className="text-sm text-gray-600">Avg File Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageCompressionRatio * 100)}%</div>
            <div className="text-sm text-gray-600">Compression</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📤 Upload Images</h2>
            <ImageDropZone
              onImagesUploaded={handleImagesUploaded}
              maxFiles={10}
              tags={['gallery']}
            />
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">🔍 Filter Images</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by filename
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All formats</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/gif">GIF</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Format Distribution */}
            {stats && Object.keys(stats.formatDistribution).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Format Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(stats.formatDistribution).map(([format, count]) => (
                    <div key={format} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {format.replace('image/', '').toUpperCase()}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🖼️ Gallery</h2>
              {(selectedFormat || searchQuery) && (
                <div className="text-sm text-gray-500">
                  Showing filtered results
                </div>
              )}
            </div>
            
            {/* Paste Area for Quick Image Upload */}
            <div className="mb-6">
              <PasteArea
                onPasteDetected={handlePasteDetected}
                onActionSelect={handlePasteAction}
                placeholder="Paste images here (Ctrl+V) to quickly add them to your gallery..."
                className="mb-4"
                showAnalysisCard={false}
              >
                <div className="text-center py-8">
                  {isProcessingPaste ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-blue-600">Processing pasted image...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📋🖼️</div>
                      <p className="text-gray-600 mb-2">
                        Paste screenshots or images here
                      </p>
                      <p className="text-sm text-gray-500">
                        Copy any image and press Ctrl+V (Cmd+V on Mac) to add it to the gallery
                      </p>
                    </div>
                  )}
                </div>
              </PasteArea>
              
              {/* Paste message */}
              {pasteMessage && (
                <div className={`p-3 rounded-lg ${
                  pasteMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>{pasteMessage.text}</span>
                    <button
                      onClick={() => setPasteMessage(null)}
                      className={`ml-2 ${
                        pasteMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
                      } hover:opacity-75`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <ImageGalleryCarousel
              key={refreshKey} // Force remount when refreshKey changes
              searchFilters={searchFilters}
              onImageDelete={handleImageDelete}
              itemsPerPage={12}
              showMetadata={true}
            />
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Image Gallery Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p>• <strong>NEW:</strong> Paste screenshots anywhere on this page with Ctrl+V</p>
            <p>• No need to click in any specific area first</p>
            <p>• Drag & drop multiple images at once</p>
            <p>• Images are automatically converted to WebP</p>
          </div>
          <div>
            <p>• Click images to view full size</p>
            <p>• Delete images with the trash button</p>
            <p>• Search and filter by format or filename</p>
            <p>• Pasted images are tagged as "clipboard"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryPage;