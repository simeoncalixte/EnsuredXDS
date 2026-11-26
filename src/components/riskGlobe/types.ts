export type GlobeSeat = 'everyone' | 'broker' | 'underwriter' | 'capacity';
export type GlobeMarker = {
  id: string;
  label: string;
  longitude: number;
  latitude: number;
  kind: 'origin' | 'provider';
  matched?: boolean;
};
export type GlobeFrame = {
  progress: number;
  seat: GlobeSeat;
  reducedMotion: boolean;
  markers: readonly GlobeMarker[];
};
export type GlobePalette = {
  surface: string;
  outline: string;
  land: string;
  origin: string;
  provider: string;
  text: string;
};

export type GlobeLabel = { id: string; text: string; x: number; y: number };
