export interface Track {
    id: string;
    title: string;
    file: any;
    category: 'meditation' | 'nature' | 'ambient' | 'background music' | 'guided session';
  }