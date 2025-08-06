import React, { useState, useCallback, useEffect } from 'react';
import { ImageDropZone, ImageGalleryCarousel } from '@/components';
import { imageGalleryRepository, ImageSearchFilters, ImageGalleryStats } from '@/services/repositories/ImageGalleryRepository';

const ImageGalleryPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<ImageGalleryStats | null>(null);
  const [searchFilters, setSearchFilters] = useState<ImageSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Image Gallery</h1>
        <p className="text-gray-600 mt-1">Upload, view, and manage images with WebP conversion</p>
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
            <p>• Drag & drop multiple images at once</p>
            <p>• Images are automatically converted to WebP</p>
            <p>• Thumbnails are generated for fast loading</p>
          </div>
          <div>
            <p>• Click images to view full size</p>
            <p>• Delete images with the trash button</p>
            <p>• Search and filter by format or filename</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryPage;