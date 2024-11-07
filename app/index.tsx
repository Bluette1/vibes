import { Stack } from 'expo-router';
import { Container } from '~/components/Container';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { CacheService } from '../utils/cacheService';

const consoleError = console.error;
console.error = (...args: any[]) => {
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

const Vibes: React.FC = () => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [nextImage, setNextImage] = useState<string>('');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [isLoading, setIsLoading] = useState(true);

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
      backgroundColor: '#1E1E1E',
    },
    imageContainer: {
      flex: 1,
      position: 'relative',
      alignItems: 'center',
      backgroundColor: '#1E1E1E',
    },
    imageWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      backgroundColor: '#1E1E1E',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: 'white',
      fontSize: 16,
    },
  });

  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  useEffect(() => {
    console.log('Images state changed:', images.length);
  }, [images]);

  useEffect(() => {
    console.log('Sound status changed:', status);
  }, [status]);

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
      console.log('Fetched images:', images); // Debug log
    };
    fetchAndLogImages();
  }, []);

  const preloadImage = async (uri: string): Promise<boolean> => {
    return Image.prefetch(uri);
  };

  // Updated cycling effect
  useEffect(() => {
    if (!images || images.length === 0) return;
    if (!images[currentImageIndex]) return;

    //   console.log('Cycling to image index:', nextIndex); // Debug log
    const cycleImage = async () => {
      const nextIndex = (currentImageIndex + 1) % images.length;
      if (nextIndex === currentImageIndex) return;

      try {
        // Preload next image
        const success = await preloadImage(images[nextIndex].src);
        console.log('Preload success:', success); // Debug log

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
          setCurrentImage(images[nextIndex].src);
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
      console.log('Setting initial image'); // Debug log
      setCurrentImage(images[0].src);
    }

    const intervalId = setInterval(cycleImage, 5000);
    console.log('Interval set'); // Debug log

    return () => {
      console.log('Cleaning up interval'); // Debug log
      clearInterval(intervalId);
    };
  }, [images, currentImageIndex]);

  const fetchImages = async () => {
    setIsLoading(true);
    const apiUrl =
      process.env.EXPO_PUBLIC_API_URL || 'https://vibes-api-space-f970ef69ea72.herokuapp.com';
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await axios.get<ImageResponse[]>(`${apiUrl}/api/images`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setImages(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.error('Request timed out');
      }
      // Handle cached images as fallback
      const cachedImagesUrls = Object.keys(offlineState.cachedImages);
      if (cachedImagesUrls.length > 0) {
        setImages(
          cachedImagesUrls.map((url) => ({
            src: offlineState.cachedImages[url],
            alt: 'Cached image',
          }))
        );
      }
    } finally {
      setIsLoading(false);
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
    const initSound = async () => {
      console.log('Sound loading effect triggered');
      await loadSound();
    };

    initSound();

    return () => {
      console.log('Cleaning up sound');
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        {isLoading || images.length == 0 ? (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Animated.View
              style={[
                styles.imageWrapper,
                {
                  opacity: fadeAnim,
                  zIndex: 2, // Add this
                },
              ]}>
              <Image
                source={{ uri: currentImage }}
                style={styles.image}
                resizeMode="cover"
                defaultSource={{ uri: '../assets/screenshot-vibes-home-page.png' }}
                onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
              />
            </Animated.View>
            <View style={[styles.imageWrapper, { zIndex: 1 }]}>
              {' '}
              {/* Add zIndex */}
              <Image
                source={{ uri: nextImage }}
                style={styles.image}
                resizeMode="cover"
                defaultSource={{ uri: '../assets/screenshot-vibes-home-page.png' }}
                onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
              />
            </View>
          </View>
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
