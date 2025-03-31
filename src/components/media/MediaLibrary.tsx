'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Loader } from '@/components/ui/loader';
import UploadModal from './UploadModal';

interface MediaItem {
  id: string;
  url: string;
  title: string | null;
  altText: string | null;
  type: string;
  createdAt: string;
}

interface MediaLibraryProps {
  showUploadModal?: boolean;
  onCloseUploadModal?: () => void;
}

export default function MediaLibrary({ showUploadModal = false, onCloseUploadModal }: MediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(showUploadModal);
  
  // Sync with parent component's modal state
  useEffect(() => {
    setIsUploadModalOpen(showUploadModal);
  }, [showUploadModal]);

  // Fetch media items on component mount
  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/media');
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setMediaItems(data);
    } catch (err) {
      setError('Failed to load media items');
      console.error('Error fetching media:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete media');
      
      // Remove the deleted item from state
      setMediaItems(prev => prev.filter(item => item.id !== id));
      if (selectedMedia?.id === id) {
        setSelectedMedia(null);
      }
    } catch (err) {
      console.error('Error deleting media:', err);
      alert('Failed to delete media item');
    }
  };

  const handleUploadSuccess = (newMedia: MediaItem) => {
    setMediaItems(prev => [newMedia, ...prev]);
    setIsUploadModalOpen(false);
    if (onCloseUploadModal) onCloseUploadModal();
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    if (onCloseUploadModal) onCloseUploadModal();
  };

  const filteredItems = mediaItems
    .filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.altText?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (a.title || '').localeCompare(b.title || '');
    });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="p-4 border-b flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative min-w-[240px]">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <Input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="min-w-[140px]"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </Select>

          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-white'}`}
              aria-label="Grid view"
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white'}`}
              aria-label="List view"
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-220px)]">
        {/* Media Grid/List */}
        <div className={`md:col-span-${selectedMedia ? '3' : '4'} overflow-auto p-4 border-r`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="mb-4">No media items found</p>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                variant="outline"
              >
                Upload your first media
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className={`relative aspect-square cursor-pointer group rounded-lg overflow-hidden border-2 ${
                    selectedMedia?.id === item.id ? 'border-indigo-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={item.altText || item.title || ''}
                    fill
                    className="object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-end p-2">
                    <div className="text-white text-sm truncate w-full">
                      {item.title || 'Untitled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedMedia?.id === item.id ? 'border-indigo-500 bg-indigo-50' : ''
                  }`}
                >
                  <div className="relative w-16 h-16 mr-4">
                    <Image
                      src={item.url}
                      alt={item.altText || item.title || ''}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title || 'Untitled'}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(item.id);
                      }}
                    >
                      <svg className="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        {selectedMedia && (
          <div className="md:col-span-1 p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Media Details</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative aspect-square mb-4">
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.altText || selectedMedia.title || ''}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-800">{selectedMedia.title || 'Untitled'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                  </label>
                  <p className="text-gray-800">{selectedMedia.altText || 'None'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <p className="text-gray-800">{selectedMedia.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uploaded On
                  </label>
                  <p className="text-gray-800">
                    {new Date(selectedMedia.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full justify-center">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Details
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-center"
                onClick={() => handleDeleteMedia(selectedMedia.id)}
              >
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Media
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
} 