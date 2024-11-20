import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Track } from '../types';
import Slider from '@react-native-community/slider';

interface TransitionSettings {
  interval: number;
}

const MIN_INTERVAL = 3000;
const MAX_INTERVAL = 30000;

const TransitionSettingsModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  settings: TransitionSettings;
  onSave: (interval: number, track: Track) => void;
  tracks: Track[];
  currentTrack: Track;
}> = ({ visible, onClose, settings, onSave, tracks, currentTrack }) => {
  const [tempInterval, setTempInterval] = useState(settings.interval);
  const [showTrackList, setShowTrackList] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track>(currentTrack);

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('@transitionSettings');
        if (savedSettings) {
          setTempInterval(JSON.parse(savedSettings).interval);
        }
        const lastTrackId = (await AsyncStorage.getItem('@lastTrackId')) || '1';
        const track = tracks.find((t) => t.id === lastTrackId) || tracks[0];
        setSelectedTrack(track);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };

    loadSavedSettings();
  }, []);

  const handleTrackSelect = async (track: Track) => {
    setShowTrackList(false);
    setSelectedTrack(track);
  };

  const renderTrackItem = ({ item }: { item: Track }) => (
    <TouchableOpacity
      testID={`track-item-${item.id}`}
      style={[styles.trackItem, selectedTrack.id === item.id && styles.selectedTrack]}
      onPress={() => handleTrackSelect(item)}>
      <Text style={styles.trackTitle}>{item.title}</Text>
      <Text style={styles.trackCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Image Transition Settings</Text>

          <Text testID="interval-text" style={styles.modalLabel}>
            Interval: {(tempInterval / 1000).toFixed(1)}s
          </Text>

          <Slider
            testID="interval-slider"
            style={styles.settingsSlider}
            value={tempInterval}
            minimumValue={MIN_INTERVAL}
            maximumValue={MAX_INTERVAL}
            step={500}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#666666"
            thumbTintColor="#FFFFFF"
            onValueChange={setTempInterval}
          />

          <TouchableOpacity
            testID="current-track-button"
            style={styles.currentTrackButton}
            onPress={() => setShowTrackList(!showTrackList)}>
            <Text testID="current-track-title" style={styles.currentTrackText}>
              {selectedTrack.title}
            </Text>
            <Text testID="current-track-category" style={styles.categoryText}>
              {selectedTrack.category}
            </Text>
          </TouchableOpacity>

          {showTrackList && (
            <View>
              <Text testID="track-list-title" style={styles.modalTitle}>
                Music Track Settings
              </Text>
              <View style={styles.trackListContainer}>
                <FlatList
                  data={tracks}
                  renderItem={renderTrackItem}
                  keyExtractor={(item) => `track-${item.id}`}
                  style={styles.trackList}
                />
              </View>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              testID="cancel-button"
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="save-button"
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                onSave(tempInterval, selectedTrack);
                onClose();
              }}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    color: 'white',
    marginBottom: 10,
  },
  settingsSlider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  trackListContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackList: {
    padding: 10,
  },
  trackItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTrack: {
    backgroundColor: '#f0f0f0',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  trackCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  currentTrackButton: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentTrackText: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
});

export default TransitionSettingsModal;
