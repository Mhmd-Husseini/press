'use client';

import { useState } from 'react';
import MediaLibrary from '@/components/media/MediaLibrary';

export default function MediaPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage images and other media files used throughout the site
          </p>
        </div>

        <MediaLibrary 
          showUploadModal={showUploadModal}
          onCloseUploadModal={() => setShowUploadModal(false)}
        />
      </div>
    </div>
  );
} 