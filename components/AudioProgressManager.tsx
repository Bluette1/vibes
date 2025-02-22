import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Track } from '../types';

const POSITION_UPDATE_INTERVAL = 1000;
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

    // Add this function to properly cleanup audio
    const cleanupAudio = async () => {
      try {
        await savePlaybackState();
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    };

    const restorePlaybackState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(PLAYBACK_STATE_KEY);
        if (!savedStateString || !currentTrack) return;

        const savedState = JSON.parse(savedStateString);

        const isRecent = Date.now() - savedState.timestamp < 60 * 60 * 1000;
        if (savedState.trackId === currentTrack.id && isRecent) {
          await onPositionRestore(savedState.position);
          await onPlaybackStateRestore(savedState.isPlaying);
        }
      } catch (error) {
        console.error('Error restoring playback state:', error);
      }
    };

    intervalId = setInterval(savePlaybackState, POSITION_UPDATE_INTERVAL);
    restorePlaybackState();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      cleanupAudio();
    };
  }, [currentTrack, sound, onPositionRestore, onPlaybackStateRestore]);

  return null;
};
export default AudioProgressManager;
