import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import axios from 'axios';
import { Audio } from 'expo-av';
import React from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';


import Vibes from '../app/vibes/index';

// Mock dependencies
jest.mock('axios');
jest.mock('expo-av');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('@react-native-community/netinfo');

jest.mock('../utils/cacheService', () => ({
  CacheService: {
    cacheFile: jest.fn(),
  },
}));

// Then import CacheService
import { CacheService } from '../utils/cacheService';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Vibes Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock implementation
    (NetInfo.useNetInfo as jest.Mock).mockImplementation(() => ({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }));
  });
  // Mock data
  const mockImages = [
    { src: 'http://example.com/image1.jpg', alt: 'Image 1' },
    { src: 'http://example.com/image2.jpg', alt: 'Image 2' },
  ];

  // Mock sound object
  const mockSound = {
    playAsync: jest.fn(),
    pauseAsync: jest.fn(),
    stopAsync: jest.fn(),
    unloadAsync: jest.fn(),
    setPositionAsync: jest.fn(),
    setVolumeAsync: jest.fn(),
    getStatusAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios get request
    (axios.get as jest.Mock).mockResolvedValue({ data: mockImages });

    // Mock Audio.Sound.createAsync
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
      status: { isLoaded: true, isPlaying: false, isBuffering: false },
    });
  });

  it('fetches and displays images on mount', async () => {
    const { getByTestId } = render(<Vibes />);
    await act(async () => {
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/images');
      });
    });
  });

  it('loads audio on mount', async () => {
    render(<Vibes />);

    await act(async () => {
      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalled();
      });
    });
  });

  it('handles play/pause correctly', async () => {
    const { getByTestId } = render(<Vibes />);

    // Mock sound status
    mockSound.getStatusAsync.mockResolvedValue({
      isLoaded: true,
      isPlaying: false,
    });

    // Wait for initial load

    await act(async () => {
      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalled();
      });
    });

    //Find and press play button
    const playButton = getByTestId('play-button');
    await act(async () => {
      fireEvent.press(playButton);
    });

    expect(mockSound.playAsync).toHaveBeenCalled();

    // Mock playing status
    mockSound.getStatusAsync.mockResolvedValue({
      isLoaded: true,
      isPlaying: true,
    });

    // Press again to pause
    await act(async () => {
      fireEvent.press(playButton);
    });

    expect(mockSound.pauseAsync).toHaveBeenCalled();
  });

  it('handles stop correctly', async () => {
    const { getByTestId } = render(<Vibes />);

    // Wait for initial load
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    const stopButton = getByTestId('stop-button');
    await act(async () => {
      fireEvent.press(stopButton);
    });

    expect(mockSound.stopAsync).toHaveBeenCalled();
    expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
  });

  it('handles volume change correctly', async () => {
    const { getByTestId } = render(<Vibes />);

    // Wait for initial load
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    const volumeSlider = getByTestId('volume-slider');
    await act(async () => {
      fireEvent(volumeSlider, 'valueChange', 0.5);
    });

    expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
  });

  it('handles errors appropriately', async () => {
    // Mock error in audio loading
    const error = new Error('Audio loading failed');
    (Audio.Sound.createAsync as jest.Mock).mockRejectedValue(error);

    render(<Vibes />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load audio file');
    });
  });

  it('formats time correctly', async () => {
    const { getAllByText } = render(<Vibes />);

    // Wait for component to mount
    await waitFor(() => {
      // Check if default time format is displayed
      const timeTexts = getAllByText('0:00');
      expect(timeTexts.length).toBe(2);
    });
  });

  it('updates volume icon based on volume level', async () => {
    const { getByTestId } = render(<Vibes />);

    // Test different volume levels
    const testVolumeLevels = [
      { volume: 0, expectedIcon: 'volume-mute' },
      { volume: 0.3, expectedIcon: 'volume-low' },
      { volume: 0.7, expectedIcon: 'volume-high' },
    ];

    for (const { volume, expectedIcon } of testVolumeLevels) {
      await act(async () => {
        const volumeSlider = getByTestId('volume-slider');
        fireEvent(volumeSlider, 'valueChange', volume);
      });

      // Check if the correct icon is displayed
      expect(getByTestId(`volume-icon-${expectedIcon}`)).toBeTruthy();
    }
  });

  it('handles offline state', async () => {
    // Mock NetInfo fetch and addEventListener
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: 'none',
    });

    let networkCallback: ((state: any) => void) | null = null;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkCallback = callback;
      callback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
      return () => {};
    });

    // Mock cached data
    const mockCachedImages = {
      'http://example.com/image1.jpg': 'file://cached/image1.jpg',
      'http://example.com/image2.jpg': 'file://cached/image2.jpg',
    };

    const mockCachedAudio = 'file://cached/audio.mp3';

    // Mock CacheService
    (CacheService.cacheFile as jest.Mock).mockImplementation(async (file) => {
      return mockCachedImages[file] || mockCachedAudio;
    });

    // Mock initial state with cached data
    const initialOfflineState = {
      isOffline: true,
      cachedImages: mockCachedImages,
      cachedAudio: mockCachedAudio,
    };

    // Mock Audio.Sound.createAsync
    const mockSound = {
      playAsync: jest.fn(),
      pauseAsync: jest.fn(),
      stopAsync: jest.fn(),
      unloadAsync: jest.fn(),
      setPositionAsync: jest.fn(),
      setVolumeAsync: jest.fn(),
      getStatusAsync: jest.fn().mockResolvedValue({
        isLoaded: true,
        isPlaying: false,
        durationMillis: 180000,
        positionMillis: 0,
      }),
    };

    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
      status: {
        isLoaded: true,
        isPlaying: false,
        durationMillis: 180000,
        positionMillis: 0,
      },
    });

    // Render component with React.useState mock for offlineState
    const setOfflineStateMock = jest.fn();
    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [initialOfflineState, setOfflineStateMock]);

    const { getByTestId, getByText } = render(<Vibes />);

    // Wait for offline indicator to appear
    await waitFor(() => {
      expect(getByText('Offline Mode')).toBeTruthy();
    });

    // Rest of the test remains the same...
    // Verify play functionality works with cached audio
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);

    await waitFor(() => {
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    // Verify stop functionality
    const stopButton = getByTestId('stop-button');
    fireEvent.press(stopButton);

    await waitFor(() => {
      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
    });

    // Verify volume control works in offline mode
    const volumeSlider = getByTestId('volume-slider');
    fireEvent(volumeSlider, 'onValueChange', 0.5);

    await waitFor(() => {
      expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
      expect(getByTestId('volume-icon-volume-low')).toBeTruthy();
    });

    // Clean up
    mockSound.unloadAsync.mockClear();
    (CacheService.cacheFile as jest.Mock).mockRestore();
  });
});
