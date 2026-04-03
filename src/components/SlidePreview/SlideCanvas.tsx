"use client";

import { useMemo } from "react";
import type { GeneratedSlide } from "@/lib/types";
import { calculateFontSize } from "@/lib/pptxExporter";

interface SlideCanvasProps {
  slide: GeneratedSlide;
  layoutRatio: number;
  scale?: number;
}

// Convert pixels to inches (at 96 DPI)
const PX_PER_INCH = 96;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PADDING_PX = 48;

export default function SlideCanvas({
  slide,
  layoutRatio,
  scale = 0.4,
}: SlideCanvasProps) {
  const hasImage = !!slide.imageDataUrl;
  const textWidthPercent = hasImage ? layoutRatio * 100 : 100;
  const imageWidthPercent = hasImage ? (1 - layoutRatio) * 100 : 0;

  const fontSizePx = useMemo(() => {
    const textAreaWidthPx = (hasImage ? CANVAS_W * layoutRatio : CANVAS_W) - PADDING_PX * 2;
    const textAreaHeightPx = CANVAS_H - PADDING_PX * 2;
    const widthInches = textAreaWidthPx / PX_PER_INCH;
    const heightInches = textAreaHeightPx / PX_PER_INCH;
    const fontSizePt = calculateFontSize(slide.text, widthInches, heightInches);
    // Convert pt to px: 1pt = 1.333px
    return Math.round(fontSizePt * 1.333);
  }, [slide.text, layoutRatio, hasImage]);

  return (
    <div
      style={{
        width: `${CANVAS_W * scale}px`,
        height: `${CANVAS_H * scale}px`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          display: "flex",
          background:
            "linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 25%, #f0e8d8 50%, #e5d8c0 75%, #f2ead8 100%)",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Text area */}
        <div
          style={{
            width: `${textWidthPercent}%`,
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: `${PADDING_PX}px`,
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontSize: `${fontSizePx}px`,
              fontWeight: "bold",
              color: "#1a1a1a",
              lineHeight: 2,
              margin: 0,
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            {slide.text}
          </p>
        </div>

        {/* Image area */}
        {hasImage && slide.imageDataUrl && (
          <div
            style={{
              width: `${imageWidthPercent}%`,
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageDataUrl}
              alt="Slide image"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
