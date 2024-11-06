import * as FileSystem from 'expo-file-system';
import { CacheService } from '../utils/cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('expo-file-system');

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'some/local/path/',
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
      uri: 'some/local/path/image.jpg',
    });
  });

  it('should initialize cache directory', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValueOnce(undefined);

    await CacheService.initializeCache();

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      expect.stringContaining('vibes_cache/'),
      { intermediates: true }
    );
  });

  it('should cache a file', async () => {
    const url = 'http://example.com/image.jpg';
    const expectedPath = 'some/local/path/vibes_cache/1730780894231_image.jpg';
    const cachedPath = await CacheService.cacheFile(url);

    expect(cachedPath).toMatch(/vibes_cache\/\d+_image.jpg/); // Use regex to match the pattern
    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      url,
      expect.stringContaining('vibes_cache')
    );
  });
  it('should retrieve a cached file', async () => {
    const url = 'http://example.com/image.jpg';
    const localPath = 'some/local/path/image.jpg';

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([{ url, localPath, timestamp: Date.now() }])
    );
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

    const cachedFilePath = await CacheService.getCachedFile(url);

    expect(cachedFilePath).toEqual(localPath);
  });

  it('should remove a cached file', async () => {
    const url = 'http://example.com/image.jpg';
    const localPath = 'some/local/path/image.jpg';

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([{ url, localPath, timestamp: Date.now() }])
    );
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValueOnce(undefined);

    await CacheService.removeCachedFile(url);

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(localPath, { idempotent: true });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
