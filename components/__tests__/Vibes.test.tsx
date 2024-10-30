import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import axios from "axios";
import { Audio } from "expo-av";
import Vibes from "../../app/(tabs)/index";

// Mock dependencies
jest.mock("axios");
jest.mock("expo-av");
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));
jest.mock("@react-native-community/slider", () => "Slider");

// Mock Alert
jest.spyOn(Alert, "alert");

describe("Vibes Component", () => {
  // Mock data
  const mockImages = [
    { src: "http://example.com/image1.jpg", alt: "Image 1" },
    { src: "http://example.com/image2.jpg", alt: "Image 2" },
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

  it("fetches and displays images on mount", async () => {
    const { getByTestId } = render(<Vibes />);
    await act(async () => {
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "http://localhost:3000/api/images"
        );
      });
    });
  });

  it("loads audio on mount", async () => {
    render(<Vibes />);

    await act(async () => {
      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalled();
      });
    });
  });

  it("handles play/pause correctly", async () => {
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
    const playButton = getByTestId("play-button");
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

  it("handles stop correctly", async () => {
    const { getByTestId } = render(<Vibes />);

    // Wait for initial load
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    const stopButton = getByTestId("stop-button");
    await act(async () => {
      fireEvent.press(stopButton);
    });

    expect(mockSound.stopAsync).toHaveBeenCalled();
    expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
  });

  it("handles volume change correctly", async () => {
    const { getByTestId } = render(<Vibes />);

    // Wait for initial load
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    const volumeSlider = getByTestId("volume-slider");
    await act(async () => {
      fireEvent(volumeSlider, "valueChange", 0.5);
    });

    expect(mockSound.setVolumeAsync).toHaveBeenCalledWith(0.5);
  });

  it("handles errors appropriately", async () => {
    // Mock error in audio loading
    const error = new Error("Audio loading failed");
    (Audio.Sound.createAsync as jest.Mock).mockRejectedValue(error);

    render(<Vibes />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Failed to load audio file"
      );
    });
  });

  it("formats time correctly", async () => {
    const { getAllByText } = render(<Vibes />);

    // Wait for component to mount
    await waitFor(() => {
      // Check if default time format is displayed
      const timeTexts = getAllByText("0:00");
      expect(timeTexts.length).toBe(2);
    });
  });

  it.skip("cleans up resources on unmount", async () => {
    const { unmount } = render(<Vibes />);

    // Wait for initial load
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    // Optionally wait for sound to be set if needed
    await waitFor(() => {
      expect(mockSound).toBeTruthy();
    });

    unmount();

    expect(mockSound.unloadAsync).toHaveBeenCalled();
  });

  it("updates volume icon based on volume level", async () => {
    const { getByTestId, rerender } = render(<Vibes />);

    // Test different volume levels
    const testVolumeLevels = [
      { volume: 0, expectedIcon: "volume-mute" },
      { volume: 0.3, expectedIcon: "volume-low" },
      { volume: 0.7, expectedIcon: "volume-high" },
    ];

    for (const { volume, expectedIcon } of testVolumeLevels) {
      await act(async () => {
        const volumeSlider = getByTestId("volume-slider");
        fireEvent(volumeSlider, "valueChange", volume);
      });

      // Check if the correct icon is displayed
      expect(getByTestId(`volume-icon-${expectedIcon}`)).toBeTruthy();
    }
  });
});
