export interface Track {
  id: string;
  title: string;
  file: string;
  category: 'meditation' | 'nature' | 'ambient' | 'background music' | 'guided session';
}
