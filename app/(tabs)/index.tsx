import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

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

const StillSpace: React.FC = () => {
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
    try {
      const response = await axios.get<ImageResponse[]>(
        "http://localhost:3000/api/images"
      );
      setImages(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSound = useCallback(async () => {
    try {
      console.log("Loading Sound");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: soundObject } = await Audio.Sound.createAsync(
        require("../../assets/focused.mp3"),
        {
          shouldPlay: false,
          volume: volume,
        },
        onPlaybackStatusUpdate
      );

      setSound(soundObject);
      setStatus((prev) => ({ ...prev, isLoaded: true }));
    } catch (error) {
      console.error("Error loading sound:", error);
      setStatus((prev) => ({
        ...prev,
        error: "Failed to load audio file",
        isLoaded: false,
      }));
      Alert.alert("Error", "Failed to load audio file");
    }
  }, [volume]);

  const onPlaybackStatusUpdate = (playbackStatus: any) => {
    if (!playbackStatus.isLoaded) {
      setStatus((prev) => ({
        ...prev,
        isLoaded: false,
        error: playbackStatus.error,
      }));
      return;
    }

    setStatus((prev) => ({
      ...prev,
      isLoaded: true,
      isPlaying: playbackStatus.isPlaying,
      isBuffering: playbackStatus.isBuffering,
    }));

    setPosition(playbackStatus.positionMillis);
    setDuration(playbackStatus.durationMillis);
  };

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [loadSound]);

  const handleVolumeChange = useCallback(
    async (value: number) => {
      setVolume(value);
      if (sound) {
        await sound.setVolumeAsync(value);
      }
    },
    [sound]
  );

  const handlePlayPause = useCallback(async () => {
    try {
      if (!sound) return;

      const playbackStatus = await sound.getStatusAsync();
      if (!playbackStatus.isLoaded) {
        setStatus((prev) => ({ ...prev, error: "Audio is not loaded" }));
        return;
      }

      if (playbackStatus.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing/pausing:", error);
      Alert.alert("Error", "Failed to play/pause audio");
    }
  }, [sound]);

  const handleStop = useCallback(async () => {
    try {
      if (!sound) return;

      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setPosition(0);
    } catch (error) {
      console.error("Error stopping:", error);
      Alert.alert("Error", "Failed to stop audio");
    }
  }, [sound]);

  const formatTime = (millis: number): string => {
    if (isNaN(millis) || millis < 0) {
      return "~"; // Default value for invalid duration
    }

    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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
        <Text style={styles.debugText}>
          Status: {status.isLoaded ? "Loaded" : "Not loaded"}
        </Text>
        <Text style={styles.debugText}>
          {status.isBuffering ? "Buffering..." : ""}
        </Text>
        {status.error && (
          <Text style={[styles.debugText, styles.errorText]}>
            Error: {status.error}
          </Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.progressSlider}
            value={position}
            minimumValue={0}
            maximumValue={duration}
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
          >
            <Ionicons
              name={status.isPlaying ? "pause-circle" : "play-circle"}
              size={60}
              color={status.isLoaded ? "white" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStop}
            style={styles.controlButton}
            activeOpacity={0.7}
            disabled={!status.isLoaded}
          >
            <Ionicons
              name="stop-circle"
              size={60}
              color={status.isLoaded ? "white" : "#666666"}
            />
          </TouchableOpacity>
        </View>

        {/* Volume Control Slider */}
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>
            Volume: {Math.round(volume * 100)}%
          </Text>
          <Slider
            style={styles.volumeSlider}
            value={volume}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#666666"
            thumbTintColor="#FFFFFF"
            onValueChange={handleVolumeChange} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  debugContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: "white",
    marginVertical: 2,
  },
  errorText: {
    color: "#ff4444",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
    borderRadius: 10,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 20,
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    width: 45,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  controlButton: {
    marginHorizontal: 10,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
  },
  volumeLabel: {
    color: "white",
    marginRight: 10,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
});

export default StillSpace;
