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
import { useAuth } from '~/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../types';
import TransitionSettingsModal from './TransitionSettingsModal';
import AudioProgressManager from './AudioProgressManager';

let fadeAnim = new Animated.Value(1);

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

interface TransitionSettings {
  interval: number;
}

const DEFAULT_INTERVAL = 5000;

const styles = StyleSheet.create({
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 50,
    zIndex: 3,
  },
  loginPrompt: {
    position: 'absolute',
    top: 60,
    right: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 3,
  },
  loginPromptText: {
    color: 'white',
    fontSize: 12,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 3,
  },
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
    fontFamily: 'Merriweather Sans',
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
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    maxWidth: '96%',
    maxHeight: '90%',
    alignSelf: 'center',
    borderRadius: 10,
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
  sessionProgressText: {
    color: 'black',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: '2%',
  },
});

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

  const { isAuthenticated, isGuest, logout } = useAuth();
  const [transitionSettings, setTransitionSettings] = useState<TransitionSettings>({
    interval: DEFAULT_INTERVAL,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const [sessionProgress, setSessionProgress] = useState<number>(0);
  const [lastSavedPosition, setLastSavedPosition] = useState<number>(0);
  const [restoringPosition, setIsRestoringPosition] = useState<boolean>(true);

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

  const preloadImage = async (uri: string): Promise<boolean> => {
    return Image.prefetch(uri);
  };

  useEffect(() => {
    const initializeApp = async () => {
      setLoadingState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await Promise.all([fetchImages(), fetchTracks()]);

        const savedSettings = await AsyncStorage.getItem('@transitionSettings');
        if (savedSettings) {
          setTransitionSettings(JSON.parse(savedSettings));
        }

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

    return () => {
      const cleanup = async () => {
        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              const position = status.positionMillis;
              await AsyncStorage.setItem(
                '@audioPosition',
                JSON.stringify({
                  position,
                  trackId: currentTrack?.id,
                })
              );
              console.log('Saved position on cleanup:', position); // Debug log
            }
            await sound.unloadAsync();
          } catch (error) {
            console.error('Cleanup error:', error);
          }
          CacheService.clearOldCache();
        }
      };

      cleanup();
    };
  }, []);
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

    const intervalId = setInterval(cycleImage, transitionSettings.interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [images, currentImageIndex]);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchTracks = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/audios`);
      const data = response.data;

      const formattedTracks: Track[] = data.map((track: any) => ({
        id: `${track.id}`,
        title: track.title,
        file: track.url,
        category: track.audio_type,
      }));

      setTracks(formattedTracks);

      const lastTrackId = (await AsyncStorage.getItem('@lastTrackId')) || '1';

      const track = formattedTracks.find((t) => t.id === lastTrackId) || formattedTracks[0];
      await loadSound(track);

      setCurrentTrack(track);
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
      throw err;
    }
  };

  const fetchImages = async () => {
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

  const handleSave = async (interval: any, selectedTrack: Track | null) => {
    try {
      await AsyncStorage.setItem(
        '@transitionSettings',
        JSON.stringify({
          interval,
        })
      );

      setTransitionSettings((prev) => ({
        ...prev,
        interval,
      }));

      if (sound) {
        const playbackStatus = await sound.getStatusAsync();
        if (playbackStatus.isLoaded && playbackStatus.isPlaying) {
          await sound.pauseAsync();
        }
      }
      if (selectedTrack) {
        setTimeout(async () => {
          await loadSound(selectedTrack);
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const loadSound = useCallback(
    async (track = currentTrack || tracks[0]) => {
      try {
        // First, cleanup any existing sound
        if (sound) {
          const currentStatus = await sound.getStatusAsync();
          if (currentStatus.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
          setSound(undefined);
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        let audioSource;
        if (offlineState.isOffline && offlineState.cachedAudio) {
          audioSource = { uri: offlineState.cachedAudio };
        } else {
          audioSource = { uri: track.file };
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
        setCurrentTrack(track);

        if ('isLoaded' in initialStatus && initialStatus.isLoaded) {
          setStatus({
            isLoaded: true,
            isPlaying: initialStatus.isPlaying,
            isBuffering: initialStatus.isBuffering,
          });

          setDuration(initialStatus.durationMillis ?? 0);
        }
      } catch (error) {
        console.error('Error loading sound:', error);
        setStatus({
          isLoaded: false,
          isPlaying: false,
          isBuffering: false,
          error: `Failed to load audio file: ${error}`,
        });
      }
    },
    [volume, offlineState.isOffline, offlineState.cachedAudio, sound]
  );

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

  const onPlaybackStatusUpdate = async (playbackStatus: AVPlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      setStatus((prev) => ({
        ...prev,
        isLoaded: false,
        error: 'error' in playbackStatus ? playbackStatus.error : undefined,
      }));
      return;
    }

    const currentPosition = playbackStatus.positionMillis ?? 0;

    setStatus((prev) => ({
      ...prev,
      isLoaded: true,
      isPlaying: playbackStatus.isPlaying,
      isBuffering: playbackStatus.isBuffering,
    }));

    if (playbackStatus.durationMillis && playbackStatus.durationMillis > 0) {
      const progress = (currentPosition / playbackStatus.durationMillis) * 100;
      setSessionProgress(progress);
    }

    setPosition(currentPosition);
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

  const handlePositionRestore = useCallback(
    async (restoredPosition: number) => {
      if (!sound) return;

      try {
        await sound.setPositionAsync(restoredPosition);
        setPosition(restoredPosition);
      } catch (error) {
        console.error('Failed to restore position:', error);
      }
    },
    [sound]
  );

  const handlePlaybackStateRestore = useCallback(
    async (shouldPlay: boolean) => {
      if (!sound) return;

      try {
        if (shouldPlay) {
          await sound.playAsync();
        } else {
          await sound.pauseAsync();
        }
        setStatus((prev) => ({
          ...prev,
          isPlaying: shouldPlay,
        }));
      } catch (error) {
        console.error('Failed to restore playback state:', error);
      }
    },
    [sound]
  );

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              await sound.stopAsync();
              await sound.unloadAsync();
              setSound(undefined); // Clear the sound reference
              setStatus({
                isLoaded: false,
                isPlaying: false,
                isBuffering: false,
              });
            }
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }
      };
      cleanup();
    };
  }, [sound]);

  return (
    <>
      <Container>
        <AudioProgressManager
          currentTrack={currentTrack}
          sound={sound}
          onPositionRestore={handlePositionRestore}
          onPlaybackStateRestore={handlePlaybackStateRestore}
        />
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>

        {tracks.length > 0 && currentTrack && (
          <TransitionSettingsModal
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            settings={transitionSettings}
            tracks={tracks}
            currentTrack={currentTrack}
            onSave={handleSave}
          />
        )}

        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout} testID="logout-button">
            <Ionicons name="log-out" size={24} color="white" />
          </TouchableOpacity>
        )}

        {isGuest && (
          <TouchableOpacity
            style={styles.loginPrompt}
            onPress={logout} // This will return to login screen
          >
            <Ionicons name="log-out" size={24} color="white" />
          </TouchableOpacity>
        )}
        {loadingState.isInitializing && (
          <View style={loadingStyles.loadingContainer} testID="loading-indicator">
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
            <View style={styles.offlineIndicator} testID="offline-indicator">
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
        <Text style={styles.sessionProgressText}>
          Session Progress: {sessionProgress.toFixed(2)}%
        </Text>
      </Container>
    </>
  );
};

export default Vibes;
