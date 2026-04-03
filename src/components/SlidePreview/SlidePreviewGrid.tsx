"use client";

import type { GeneratedSlide } from "@/lib/types";
import SlideCanvas from "./SlideCanvas";

interface SlidePreviewGridProps {
  slides: GeneratedSlide[];
  layoutRatio: number;
}

export default function SlidePreviewGrid({
  slides,
  layoutRatio,
}: SlidePreviewGridProps) {
  if (slides.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Generated Slides ({slides.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="space-y-2">
            <p className="text-sm font-medium text-gray-500">
              Slide {index + 1}
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm inline-block">
              <SlideCanvas
                slide={slide}
                layoutRatio={layoutRatio}
                scale={0.4}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
