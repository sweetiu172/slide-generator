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
