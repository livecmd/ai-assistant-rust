/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Download, Clock, Play } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onSelect }) => {
  const [videoUrls, setVideoUrls] = useState<Map<string, string>>(new Map());

  // Convert base64 data to object URLs
  useEffect(() => {
    const urls = new Map<string, string>();

    const loadVideos = async () => {
      for (const item of history) {
        if (item.videoData && !videoUrls.has(item.id)) {
          try {
            // Convert base64 to blob
            const res = await fetch(item.videoData);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            urls.set(item.id, url);
          } catch (error) {
            console.error('Failed to load video:', error);
          }
        }
      }
      if (urls.size > 0) {
        setVideoUrls(new Map([...videoUrls, ...urls]));
      }
    };

    loadVideos();

    // Cleanup URLs when component unmounts
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [history]);

  const handleDownload = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    const url = videoUrls.get(item.id);
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = `veo-video-${item.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) return null;

  return (
    <div className="w-full bg-[#1f1f1f] border border-gray-700 rounded-2xl p-6 mb-4">
      <div className="flex items-center gap-2 mb-4 text-gray-400">
        <Clock size={18} />
        <h2 className="text-sm font-semibold tracking-wider">Generation History</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => {
          const videoUrl = videoUrls.get(item.id);
          if (!videoUrl) return null;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group relative aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500/50 cursor-pointer transition-all"
            >
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                loop
                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                onMouseLeave={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.pause();
                  video.currentTime = 0;
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                <div className="text-xs text-gray-300 mb-2 line-clamp-2">
                  {item.prompt}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleDownload(e, item)}
                    className="flex-1 bg-gray-800/80 hover:bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg backdrop-blur-sm flex items-center justify-center gap-2 transition-colors border border-white/10"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>

              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {item.resolution}
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded">
                <Play size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryGallery;
