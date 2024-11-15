// app/config/tracks.ts
export interface Track {
  id: string;
  title: string;
  file: any; // Using require() for local files
  category: 'meditation' | 'nature' | 'ambient';
}

export const tracks: Track[] = [
  {
    id: '1',
    title: 'Meditation',
    file: require('../../assets/audio/meditation.mp3'),
    category: 'meditation',
  },
  {
    id: '2',
    title: 'Ocean Waves',
    file: require('../../assets/audio/mindfulness.mp3'),
    category: 'nature',
  },
  {
    id: '3',
    title: 'Forest Ambience',
    file: require('../../assets/audio/loving-kindness.mp3'),
    category: 'nature',
  },
  {
    id: '4',
    title: 'Focus',
    file: require('../../assets/audio/focused.mp3'),
    category: 'ambient',
  },
  {
    id: '5',
    title: 'Deep Focus',
    file: require('../../assets/audio/deep-focus.mp3'),
    category: 'ambient',
  },
];
