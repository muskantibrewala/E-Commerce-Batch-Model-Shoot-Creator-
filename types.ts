
export enum ShotType {
  HERO = 'HERO',
  FRONT = 'FRONT',
  SIDE = 'SIDE',
  BACK = 'BACK',
  DETAIL = 'DETAIL',
  SEATED = 'SEATED'
}

export type BackgroundType = 'color' | 'image';

export interface BackgroundConfig {
  type: BackgroundType;
  value: string; // Hex color or base64 image data
  name: string;
}

export interface ShotDefinition {
  id: ShotType;
  label: string;
  description: string;
  instruction: string;
}

export interface OutputAsset {
  shotId: ShotType;
  productId: string; // ID or Index of the source image
  url: string;
  label: string;
}

export interface ProductImage {
  id: string;
  data: string; // base64
  name: string;
}

export interface StudioSession {
  productImages: ProductImage[];
  selectedShots: ShotType[];
  customRequirements: string;
  backgroundConfig: BackgroundConfig;
  outputAssets: OutputAsset[];
  isLoading: boolean;
  currentProductIndex: number;
  currentShotIndex: number;
}
