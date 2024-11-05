// hooks/useOfflineContent.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { CacheService } from '../utils/cacheService';

interface OfflineContent {
  id: string;
  imageUrl: string;
  audioUrl: string;
  title: string;
  duration: number;
}

export const useOfflineContent = (content: OfflineContent) => {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  const [cachedAudio, setCachedAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnectivity = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    checkConnectivity();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cacheContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check for cached image
        let imagePath = await CacheService.getCachedFile(content.imageUrl);
        if (!imagePath) {
          imagePath = await CacheService.cacheFile(content.imageUrl, 'image');
        }
        setCachedImage(imagePath);

        // Check for cached audio
        let audioPath = await CacheService.getCachedFile(content.audioUrl);
        if (!audioPath) {
          audioPath = await CacheService.cacheFile(content.audioUrl, 'audio');
        }
        setCachedAudio(audioPath);
      } catch (err) {
        setError('Failed to cache content for offline use');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    cacheContent();
  }, [content]);

  return {
    isOffline,
    cachedImage,
    cachedAudio,
    isLoading,
    error,
    isContentAvailable: !!(cachedImage && cachedAudio),
  };
};
