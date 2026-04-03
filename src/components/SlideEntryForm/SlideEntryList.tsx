"use client";

import type { SlideEntry } from "@/lib/types";
import SlideEntryForm from "./SlideEntryForm";

interface SlideEntryListProps {
  entries: SlideEntry[];
  onTextChange: (id: string, text: string) => void;
  onImageChange: (id: string, file: File | null) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export default function SlideEntryList({
  entries,
  onTextChange,
  onImageChange,
  onRemove,
  onAdd,
}: SlideEntryListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Slide Entries</h2>
      {entries.map((entry, index) => (
        <SlideEntryForm
          key={entry.id}
          entry={entry}
          index={index}
          canRemove={entries.length > 1}
          onTextChange={onTextChange}
          onImageChange={onImageChange}
          onRemove={onRemove}
        />
      ))}
      <button
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors font-medium cursor-pointer"
      >
        + Add Slide Entry
      </button>
    </div>
  );
}
