import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TransitionSettingsModal from '../components/TransitionSettingsModal';
import { Track } from '../types';

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
describe('TransitionSettingsModal', () => {
  const tracks: Track[] = [
    {
      id: '1',
      file: 'http://example.com/track1.mp3',
      title: 'Track 1',
      category: 'guided session',
    },
    { id: '2', file: 'http://example.com/track2.mp3', title: 'Track 2', category: 'nature' },
  ];

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const defaultSettings = {
    interval: 3000,
    trackId: '1',
  };
  const currentTrack = tracks[0];

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    settings: defaultSettings,
    onSave: mockOnSave,
    tracks,
    currentTrack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial track', () => {
    const { getByTestId } = render(<TransitionSettingsModal {...defaultProps} />);
    expect(getByTestId('current-track-title').props.children).toBe(currentTrack.title);
    expect(getByTestId('current-track-category').props.children).toBe(currentTrack.category);
  });

  it('shows track list when current track button is pressed', () => {
    const { getByTestId, queryByTestId } = render(<TransitionSettingsModal {...defaultProps} />);

    const trackButton = getByTestId('current-track-button');
    fireEvent.press(trackButton);

    expect(queryByTestId('track-list-title')).toBeTruthy();
    tracks.forEach((track) => {
      expect(queryByTestId(`track-item-${track.id}`)).toBeTruthy();
    });
  });

  it('selects different track when pressed', async () => {
    const { getByTestId } = render(<TransitionSettingsModal {...defaultProps} />);

    // Open track list
    const trackButton = getByTestId('current-track-button');
    fireEvent.press(trackButton);

    // Select different track
    const newTrack = tracks[1];
    const newTrackButton = getByTestId(`track-item-${newTrack.id}`);
    fireEvent.press(newTrackButton);

    await waitFor(() => {
      expect(getByTestId('current-track-title').props.children).toBe(newTrack.title);
    });
  });

  it('saves settings with new track when save button pressed', () => {
    const { getByTestId } = render(<TransitionSettingsModal {...defaultProps} />);

    // Open track list
    const trackButton = getByTestId('current-track-button');
    fireEvent.press(trackButton);

    // Select different track
    const newTrack = tracks[1];
    const newTrackButton = getByTestId(`track-item-${newTrack.id}`);
    fireEvent.press(newTrackButton);

    // Press save
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(defaultSettings.interval, newTrack);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('loads saved settings on modal open', () => {
    const savedSettings = {
      interval: 5000,
      trackId: '2',
    };

    const { getByTestId } = render(
      <TransitionSettingsModal
        {...defaultProps}
        settings={savedSettings}
        currentTrack={tracks[1]}
      />
    );

    expect(getByTestId('current-track-title').props.children).toBe(tracks[1].title);
    expect(getByTestId('interval-text').props.children).toContain('5.0');
  });

  it('closes modal when cancel is pressed', () => {
    const { getByTestId } = render(<TransitionSettingsModal {...defaultProps} />);

    const cancelButton = getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
