import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Track } from '../types';

const POSITION_UPDATE_INTERVAL = 1000;
const POSITION_STORAGE_KEY = '@audioPosition';
const PLAYBACK_STATE_KEY = '@playbackState';

interface AudioProgressManagerProps {
  currentTrack: Track | null;
  sound: Audio.Sound | undefined;
  onPositionRestore: (position: number) => Promise<void>;
  onPlaybackStateRestore: (isPlaying: boolean) => Promise<void>;
}

const AudioProgressManager: React.FC<AudioProgressManagerProps> = ({
  currentTrack,
  sound,
  onPositionRestore,
  onPlaybackStateRestore,
}) => {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const savePlaybackState = async () => {
      if (!sound || !currentTrack) return;

      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;

        // Save both position and playback state
        const playbackData = {
          position: status.positionMillis,
          isPlaying: status.isPlaying,
          trackId: currentTrack.id,
          timestamp: Date.now(),
        };

        await AsyncStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify(playbackData));
      } catch (error) {
        console.error('Error saving playback state:', error);
      }
    };

    const restorePlaybackState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(PLAYBACK_STATE_KEY);
        if (!savedStateString || !currentTrack) return;

        const savedState = JSON.parse(savedStateString);

        // Only restore if it's the same track and within last hour
        const isRecent = Date.now() - savedState.timestamp < 60 * 60 * 1000;
        if (savedState.trackId === currentTrack.id && isRecent) {
          await onPositionRestore(savedState.position);
          await onPlaybackStateRestore(savedState.isPlaying);
        }
      } catch (error) {
        console.error('Error restoring playback state:', error);
      }
    };

    // Start periodic saving
    intervalId = setInterval(savePlaybackState, POSITION_UPDATE_INTERVAL);

    // Restore state when component mounts
    restorePlaybackState();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Save state one final time when unmounting
      savePlaybackState();
    };
  }, [currentTrack, sound, onPositionRestore, onPlaybackStateRestore]);

  return null;
};

export default AudioProgressManager;
