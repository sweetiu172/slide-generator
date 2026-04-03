"use client";

import { useSlideGenerator } from "@/hooks/useSlideGenerator";
import SlideEntryList from "@/components/SlideEntryForm/SlideEntryList";
import SlidePreviewGrid from "@/components/SlidePreview/SlidePreviewGrid";
import LayoutSelector from "@/components/LayoutSelector/LayoutSelector";
import ExportControls from "@/components/ExportControls/ExportControls";

export default function Home() {
  const {
    entries,
    generatedSlides,
    layoutRatio,
    isGenerated,
    addEntry,
    removeEntry,
    updateEntryText,
    setEntryImage,
    setLayoutRatio,
    generateSlides,
    reset,
  } = useSlideGenerator();

  const hasText = entries.some((e) => e.text.trim().length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Slide Generator
          </h1>
          {isGenerated && (
            <button
              onClick={reset}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Input section */}
        <div className="space-y-6">
          <SlideEntryList
            entries={entries}
            onTextChange={updateEntryText}
            onImageChange={setEntryImage}
            onRemove={removeEntry}
            onAdd={addEntry}
          />

          <div className="flex flex-wrap items-end gap-6">
            <LayoutSelector ratio={layoutRatio} onChange={setLayoutRatio} />

            <button
              onClick={generateSlides}
              disabled={!hasText}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Generate Slides
            </button>
          </div>
        </div>

        {/* Preview and export section */}
        {isGenerated && generatedSlides.length > 0 && (
          <div className="space-y-6 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between">
              <div />
              <ExportControls
                slides={generatedSlides}
                layoutRatio={layoutRatio}
              />
            </div>
            <SlidePreviewGrid
              slides={generatedSlides}
              layoutRatio={layoutRatio}
            />
          </div>
        )}
      </main>
    </div>
  );
}
