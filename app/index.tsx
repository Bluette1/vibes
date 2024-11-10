import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  Animated,
  ViewStyle,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { CacheService } from '../utils/cacheService';
import axios from 'axios';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Container } from '~/components/Container';
import Slider from '@react-native-community/slider';

let fadeAnim = new Animated.Value(1);

const consoleError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('findDOMNode')) {
    return;
  }
  consoleError(...args);
};

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

interface LoadingState {
  isInitializing: boolean;
  isLoading: boolean;
  retryCount: number;
  error: string | null;
}

const Vibes: React.FC = () => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [nextImage, setNextImage] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isInitializing: true,
    isLoading: false,
    retryCount: 0,
    error: null,
  });
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      margin: 0,
      padding: 0,
    },
    imageContainer: {
      flex: 1,
      position: 'relative',
      alignItems: 'center',
    },
    imageWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      maxWidth: '96%',
      maxHeight: '90%',
      alignSelf: 'center',
      borderRadius: 8,
    },
    debugText: {
      color: 'white',
      marginVertical: '1%',
      fontSize: 14,
    },
    errorText: {
      color: '#ff4444',
    },
    controlsContainer: {
      position: 'absolute',
      bottom: '10%',
      width: '90%',
      alignSelf: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '4%',
      margin: '4%',
      borderRadius: 10,
      maxWidth: 600,
      zIndex: 2,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: '4%',
    },
    progressSlider: {
      flex: 1,
      marginHorizontal: '2%',
    },
    timeText: {
      color: 'white',
      fontSize: 12,
      minWidth: 45,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '4%',
      width: '100%',
    },
    controlButton: {
      marginHorizontal: '3%',
      padding: '2%',
    },
    volumeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      maxWidth: 500,
    },
    volumeLabel: {
      color: 'white',
      marginRight: '2%',
      fontSize: 14,
      minWidth: 80,
    },
    volumeSlider: {
      flex: 1,
      height: 40,
    },
    offlineIndicator: {
      position: 'absolute',
      top: '2%',
      right: '2%',
      backgroundColor: 'rgba(255, 215, 0, 0.8)',
      padding: '2%',
      borderRadius: 5,
    },
    offlineText: {
      color: '#000',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });

  const loadingStyles = StyleSheet.create({
    loadingContainer: {
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    } as ViewStyle,
    loadingText: {
      color: 'white',
      fontSize: 18,
      marginTop: '3%',
      textAlign: 'center',
      paddingHorizontal: '5%',
    },
    retryButton: {
      backgroundColor: '#4A90E2',
      paddingVertical: '3%',
      paddingHorizontal: '6%',
      borderRadius: 5,
      marginTop: '4%',
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
    },
  });

  const formatUrl = (image: string) => image.split('?')[0];

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
    const fetchAndLogImages = async () => {
      await fetchImages();
    };
    fetchAndLogImages();
  }, []);

  const preloadImage = async (uri: string): Promise<boolean> => {
    return Image.prefetch(uri);
  };

  useEffect(() => {
    const initializeApp = async () => {
      setLoadingState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await Promise.all([fetchImages(), loadSound()]);
        setLoadingState((prev) => ({
          ...prev,
          isInitializing: false,
          isLoading: false,
        }));
      } catch (error) {
        setLoadingState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize app. Please try again.',
          retryCount: prev.retryCount + 1,
        }));
      }
    };

    initializeApp();
  }, []); // Empty dependency array for initial load only

  // Add retry handler
  const handleRetry = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
    }));
  }, []);

  useEffect(() => {
    if (!images || images.length === 0) return;
    if (!images[currentImageIndex]) return;

    const cycleImage = async () => {
      const nextIndex = (currentImageIndex + 1) % images.length;
      if (nextIndex === currentImageIndex) return;

      try {
        // Preload next image
        await preloadImage(formatUrl(images[nextIndex].src));

        // Fade out current image
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start();

        // Set next image
        setNextImage(images[nextIndex].src);

        // After fade out, update current image and fade back in
        setTimeout(() => {
          setCurrentImage(formatUrl(images[nextIndex].src));
          setCurrentImageIndex(nextIndex);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }, 1000);
      } catch (error) {
        console.error('Failed to load next image:', error);
      }
    };

    // Set initial image
    if (!currentImage && images[0]) {
      setCurrentImage(formatUrl(images[0].src));
    }

    const intervalId = setInterval(cycleImage, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [images, currentImageIndex]);

  // Modify the fetchImages function
  const fetchImages = async () => {
    const apiUrl =
      process.env.EXPO_PUBLIC_API_URL || 'https://vibes-api-space-f970ef69ea72.herokuapp.com';
    try {
      if (offlineState.isOffline) {
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
      if (!response.data || response.data.length === 0) {
        throw new Error('No images received from server');
      }
      setImages(response.data);

      // Cache images for offline use
      const cachedImages: { [key: string]: string } = {};
      await Promise.all(
        response.data.map(async (image) => {
          try {
            const cachedPath = await CacheService.cacheFile(image.src);
            cachedImages[image.src] = cachedPath;
          } catch (error) {
            console.error('Failed to cache image:', error);
          }
        })
      );

      setOfflineState((prev) => ({
        ...prev,
        cachedImages,
      }));
    } catch (error) {
      console.error('Failed to fetch images:', error);
      throw error;
    }
  };

  const loadSound = useCallback(async () => {
    try {
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
    const initSound = async () => {
      await loadSound();
    };

    initSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      CacheService.clearOldCache;
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    try {
      if (!sound) {
        return;
      }

      const playbackStatus = await sound.getStatusAsync();

      if (!playbackStatus.isLoaded) {
        await loadSound();
        return;
      }

      if (playbackStatus.isPlaying) {
        await sound.pauseAsync();
      } else {
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
    <>
      <Container>
        {loadingState.isInitializing && (
          <View style={loadingStyles.loadingContainer}>
            <Ionicons name="reload-circle" size={50} color="white" />
            <Text style={loadingStyles.loadingText}>
              {loadingState.isLoading ? 'Loading...' : 'Initializing...'}
            </Text>
            {loadingState.error && (
              <>
                <Text style={[loadingStyles.loadingText, { color: '#ff4444' }]}>
                  {loadingState.error}
                </Text>
                <TouchableOpacity style={loadingStyles.retryButton} onPress={handleRetry}>
                  <Text style={loadingStyles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            <Animated.View
              style={[
                styles.imageWrapper,
                {
                  opacity: fadeAnim,
                  zIndex: 2,
                },
              ]}>
              <Image
                source={{ uri: currentImage }}
                style={styles.image}
                resizeMode="cover"
                onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
              />
            </Animated.View>
            <View style={[styles.imageWrapper, { zIndex: 1 }]}>
              <Image
                source={{ uri: nextImage }}
                style={styles.image}
                resizeMode="cover"
                onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
              />
            </View>
          </View>
        )}

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
              <Ionicons
                name="stop-circle"
                size={60}
                color={status.isLoaded ? 'white' : '#666666'}
              />
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
      </Container>
    </>
  );
};

export default Vibes;
