export interface SlideEntry {
  id: string;
  text: string;
  imageFile: File | null;
  imageDataUrl: string | null;
}

export interface GeneratedSlide {
  id: string;
  entryId: string;
  text: string;
  imageDataUrl: string | null;
  slideIndex: number;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  quality: string;
}

export interface TTSSettings {
  voice: string;
  lengthScale: number;
  noiseScale: number;
  noiseW: number;
}
