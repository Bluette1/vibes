import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { CacheService } from '../utils/cacheService';
interface ImageResponse {
  src: string;
  alt: string;
}

interface AudioPlayerStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  error?: string;
}
interface OfflineState {
  isOffline: boolean;
  cachedImages: { [key: string]: string };
  cachedAudio: string | null;
}

const Vibes: React.FC = () => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const [sound, setSound] = useState<Audio.Sound>();
  const [status, setStatus] = useState<AudioPlayerStatus>({
    isLoaded: false,
    isPlaying: false,
    isBuffering: false,
  });
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);

  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOffline: false,
    cachedImages: {},
    cachedAudio: null,
  });

  useEffect(() => {
    const checkConnectivity = async () => {
      const netInfo = await NetInfo.fetch();
      setOfflineState((prev) => ({ ...prev, isOffline: !netInfo.isConnected }));
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      setOfflineState((prev) => ({ ...prev, isOffline: !state.isConnected }));
    });

    checkConnectivity();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchImages();

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [images]);

  const fetchImages = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    try {
      if (offlineState.isOffline) {
        // Use cached images if available
        const cachedImagesUrls = Object.keys(offlineState.cachedImages);
        if (cachedImagesUrls.length > 0) {
          const cachedImageResponses = cachedImagesUrls.map((url) => ({
            src: offlineState.cachedImages[url],
            alt: 'Cached image',
          }));
          setImages(cachedImageResponses);
          return;
        }
      }

      const response = await axios.get<ImageResponse[]>(`${apiUrl}/api/images`);
      setImages(response.data);

      // Cache images for offline use
      const cachedImages: { [key: string]: string } = {};
      for (const image of response.data) {
        try {
          const cachedPath = await CacheService.cacheFile(image.src);
          cachedImages[image.src] = cachedPath;
        } catch (error) {
          console.error('Failed to cache image:', error);
        }
      }

      setOfflineState((prev) => ({
        ...prev,
        cachedImages,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const loadSound = useCallback(async () => {
    try {
      console.log('Starting audio load process');

      if (sound) {
        await sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Handle offline audio
      let audioSource;
      if (offlineState.isOffline && offlineState.cachedAudio) {
        audioSource = { uri: offlineState.cachedAudio };
      } else {
        audioSource = require('../assets/focused.mp3');
        // Cache the audio file if online
        if (!offlineState.isOffline) {
          try {
            const cachedPath = await CacheService.cacheFile(audioSource);
            setOfflineState((prev) => ({ ...prev, cachedAudio: cachedPath }));
          } catch (error) {
            console.error('Failed to cache audio:', error);
          }
        }
      }

      const { sound: soundObject, status: initialStatus } = await Audio.Sound.createAsync(
        audioSource,
        {
          shouldPlay: false,
          volume,
          progressUpdateIntervalMillis: 100,
          isLooping: true,
        },
        onPlaybackStatusUpdate
      );

      setSound(soundObject);

      if ('isLoaded' in initialStatus && initialStatus.isLoaded) {
        setStatus((prev) => ({
          ...prev,
          isLoaded: true,
          isPlaying: initialStatus.isPlaying,
          isBuffering: initialStatus.isBuffering,
        }));
        setDuration(initialStatus.durationMillis ?? 0);
      }
    } catch (error) {
      console.error('Detailed error loading sound:', error);
      setStatus((prev) => ({
        ...prev,
        error: `Failed to load audio file: ${error}`,
        isLoaded: false,
      }));
      Alert.alert('Error', 'Failed to load audio file');
    }
  }, [volume, offlineState.isOffline, offlineState.cachedAudio]);

  useEffect(() => {
    console.log('Sound loading effect triggered');
    loadSound();

    return () => {
      console.log('Cleaning up sound');
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []); // Remove loadSound from dependencies to prevent infinite loop

  const handlePlayPause = useCallback(async () => {
    try {
      if (!sound) {
        console.log('No sound object available');
        return;
      }

      const playbackStatus = await sound.getStatusAsync();
      console.log('Current playback status:', playbackStatus);

      if (!playbackStatus.isLoaded) {
        console.log('Sound not loaded, attempting to reload');
        await loadSound();
        return;
      }

      if (playbackStatus.isPlaying) {
        console.log('Pausing sound');
        await sound.pauseAsync();
      } else {
        console.log('Playing sound');
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
      Alert.alert('Error', 'Failed to play/pause audio');
    }
  }, [sound, loadSound]);

  const onPlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      setStatus((prev) => ({
        ...prev,
        isLoaded: false,
        error: 'error' in playbackStatus ? playbackStatus.error : undefined,
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      isLoaded: true,
      isPlaying: playbackStatus.isPlaying,
      isBuffering: playbackStatus.isBuffering,
    }));

    // Provide default value of 0 if positionMillis is undefined
    setPosition(playbackStatus.positionMillis ?? 0);

    // Provide default value of 0 if durationMillis is undefined
    setDuration(playbackStatus.durationMillis ?? 0);
  };

  const handleVolumeChange = useCallback(
    async (value: number) => {
      try {
        setVolume(value);
        if (sound && status.isLoaded) {
          await sound.setVolumeAsync(value);
        }
      } catch (error) {
        console.error('Error changing volume:', error);
        Alert.alert('Error', 'Failed to change volume');
      }
    },
    [sound, status.isLoaded]
  );

  const handleStop = useCallback(async () => {
    try {
      if (!sound) return;

      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setPosition(0);
    } catch (error) {
      console.error('Error stopping:', error);
      Alert.alert('Error', 'Failed to stop audio');
    }
  }, [sound]);

  const formatTime = (millis: number): string => {
    if (isNaN(millis) || duration < 0) {
      return '0:00'; // Default value for invalid duration
    }

    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0) {
      return 'volume-mute';
    } else if (volume <= 0.5) {
      return 'volume-low';
    } else if (volume <= 1) {
      return 'volume-high';
    }
    return 'volume-medium';
  };

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <Image
          source={{ uri: images[currentImageIndex].src }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Status: {status.isLoaded ? 'Loaded' : 'Not loaded'}</Text>
        <Text style={styles.debugText}>{status.isBuffering ? 'Buffering...' : ''}</Text>
        {status.error && (
          <Text style={[styles.debugText, styles.errorText]}>Error: {status.error}</Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.progressSlider}
            value={isNaN(position) ? 0 : position}
            minimumValue={0}
            maximumValue={isNaN(duration) ? 0 : duration}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#666666"
            thumbTintColor="#FFFFFF"
            onSlidingComplete={async (value) => {
              if (sound) {
                await sound.setPositionAsync(value);
              }
            }}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.controlButton}
            activeOpacity={0.7}
            disabled={!status.isLoaded}
            testID="play-button">
            <Ionicons
              name={status.isPlaying ? 'pause-circle' : 'play-circle'}
              size={60}
              color={status.isLoaded ? 'white' : '#666666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStop}
            style={styles.controlButton}
            activeOpacity={0.7}
            disabled={!status.isLoaded}
            testID="stop-button">
            <Ionicons name="stop-circle" size={60} color={status.isLoaded ? 'white' : '#666666'} />
          </TouchableOpacity>
        </View>
        {offlineState.isOffline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}
        {/* Volume Control with Icon */}
        <View style={styles.volumeContainer}>
          <Ionicons
            testID={`volume-icon-${getVolumeIcon()}`}
            name={getVolumeIcon()}
            size={24}
            color="white"
          />
          <Text style={styles.volumeLabel}>Volume: {Math.round(volume * 100)}%</Text>
          <Slider
            style={styles.volumeSlider}
            value={volume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#666666"
            thumbTintColor="#FFFFFF"
            onValueChange={handleVolumeChange}
            testID="volume-slider"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  debugContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    marginVertical: 2,
  },
  errorText: {
    color: '#ff4444',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
  },
  progressSlider: {
    width: '90%',
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    width: 45,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    marginHorizontal: 10,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  volumeLabel: {
    color: 'white',
    marginRight: 10,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    padding: 8,
    borderRadius: 5,
  },
  offlineText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default Vibes;
