// utils/cacheService.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem {
  url: string;
  localPath: string;
  timestamp: number;
}

export class CacheService {
  private static CACHE_DIR = `${FileSystem.cacheDirectory}vibes_cache/`;
  private static CACHE_INDEX_KEY = 'vibes_cache_index';
  private static CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async initializeCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize cache directory:', error);
    }
  }

  static async cacheFile(url: string): Promise<string> {
    try {
      const filename = `${Date.now()}_${url.split('/').pop()}`;
      const localPath = `${this.CACHE_DIR}${filename}`;

      await FileSystem.downloadAsync(url, localPath);

      await this.updateCacheIndex({
        url,
        localPath,
        timestamp: Date.now(),
      });

      return localPath;
    } catch (error) {
      console.error('Failed to cache file:', error);
      throw error;
    }
  }

  static async getCachedFile(url: string): Promise<string | null> {
    try {
      const cacheIndex = await this.getCacheIndex();
      const cachedItem = cacheIndex.find((item) => item.url === url);

      if (cachedItem) {
        const fileInfo = await FileSystem.getInfoAsync(cachedItem.localPath);
        if (fileInfo.exists) {
          if (Date.now() - cachedItem.timestamp > this.CACHE_EXPIRY) {
            await this.removeCachedFile(url);
            return null;
          }
          return cachedItem.localPath;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached file:', error);
      return null;
    }
  }

  private static async getCacheIndex(): Promise<CacheItem[]> {
    try {
      const index = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('Failed to get cache index:', error);
      return [];
    }
  }

  private static async updateCacheIndex(item: CacheItem) {
    try {
      const index = await this.getCacheIndex();
      const existingItemIndex = index.findIndex((i) => i.url === item.url);

      if (existingItemIndex >= 0) {
        index[existingItemIndex] = item;
      } else {
        index.push(item);
      }

      await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to update cache index:', error);
    }
  }

  static async removeCachedFile(url: string) {
    try {
      const index = await this.getCacheIndex();
      const item = index.find((i) => i.url === url);

      if (item) {
        await FileSystem.deleteAsync(item.localPath, { idempotent: true });
        const newIndex = index.filter((i) => i.url !== url);
        await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(newIndex));
      }
    } catch (error) {
      console.error('Failed to remove cached file:', error);
    }
  }

  static async clearOldCache() {
    try {
      // Get the cache index to remove all files
      const index = await this.getCacheIndex();
      for (const item of index) {
        await FileSystem.deleteAsync(item.localPath, { idempotent: true });
      }
      // Clear the cache index
      await AsyncStorage.removeItem(this.CACHE_INDEX_KEY);
      console.log('Cache cleared successfully.');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
