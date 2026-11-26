export type GlobeSeat = 'everyone' | 'broker' | 'underwriter' | 'capacity';
export type GlobeMarker = {
  id: string;
  label: string;
  longitude: number;
  latitude: number;
  kind: 'origin' | 'provider';
  matched?: boolean;
};
export type GlobeRecord = { label: string; targetId: string };
export type GlobeFrame = {
  progress: number;
  seat: GlobeSeat;
  reducedMotion: boolean;
  markers: readonly GlobeMarker[];
  hasDetail?: boolean;
  records?: readonly GlobeRecord[];
};
export type GlobePalette = {
  surface: string;
  outline: string;
  land: string;
  origin: string;
  provider: string;
  text: string;
};

export type GlobeLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  anchorX?: number;
  anchorY?: number;
  width?: number;
  height?: number;
  kind?: 'platform' | 'person' | 'record';
  targetId?: string;
  accessibleLabel?: string;
};
