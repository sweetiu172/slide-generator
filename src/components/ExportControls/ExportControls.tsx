"use client";

import { useState } from "react";
import type { GeneratedSlide } from "@/lib/types";
import { exportToPptx } from "@/lib/pptxExporter";

interface ExportControlsProps {
  slides: GeneratedSlide[];
  layoutRatio: number;
}

export default function ExportControls({
  slides,
  layoutRatio,
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      await exportToPptx(slides, layoutRatio, "slides");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export slides. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={slides.length === 0 || isExporting}
      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      {isExporting ? "Exporting..." : "Download PPTX"}
    </button>
  );
}
